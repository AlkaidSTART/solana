import { Queue } from "bullmq";
import Redis from "ioredis";

import { ApiError } from "@/lib/server/http/errors";
import { getRuntimeConfig } from "@/lib/server/config/env";

export type QueueHealth = "ok" | "down" | "unconfigured";

let queueConnection: Redis | null = null;
let queueConnectionUrl: string | null = null;
let healthConnection: Redis | null = null;
let healthConnectionUrl: string | null = null;
const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  const url = getRuntimeConfig().redisUrl;
  if (!url) {
    throw new ApiError(503, "QUEUE_UNCONFIGURED", "Queue is not configured", { retryable: true });
  }
  if (queueConnection && queueConnectionUrl !== url) {
    throw new Error("REDIS_URL changed after queue initialization; close the queue before reconfiguring it.");
  }

  let queue = queues.get(name);
  if (!queue) {
    try {
      queueConnection ??= new Redis(url, { lazyConnect: true, maxRetriesPerRequest: null });
      queueConnectionUrl = url;
      queue = new Queue(name, { connection: queueConnection });
      queues.set(name, queue);
    } catch {
      queueConnection?.disconnect();
      queueConnection = null;
      queueConnectionUrl = null;
      throw new ApiError(503, "QUEUE_UNAVAILABLE", "Queue connection could not be initialized", {
        retryable: true,
      });
    }
  }

  return queue;
}

export async function checkQueue(): Promise<QueueHealth> {
  const url = getRuntimeConfig().redisUrl;
  if (!url) {
    return "unconfigured";
  }
  if (healthConnection && healthConnectionUrl !== url) {
    healthConnection.disconnect();
    healthConnection = null;
    healthConnectionUrl = null;
  }

  let connection: Redis | null = null;
  try {
    connection = healthConnection ?? new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      retryStrategy: (attempt) => attempt <= 1 ? 100 : null,
    });
    healthConnection = connection;
    healthConnectionUrl = url;
    await connection.ping();
    return "ok";
  } catch {
    connection?.disconnect();
    healthConnection = null;
    healthConnectionUrl = null;
    return "down";
  }
}

export async function closeForTests(): Promise<void> {
  const activeQueues = [...queues.values()];
  queues.clear();
  await Promise.all(activeQueues.map((queue) => queue.close()));

  const activeQueueConnection = queueConnection;
  const activeHealthConnection = healthConnection;
  queueConnection = null;
  queueConnectionUrl = null;
  healthConnection = null;
  healthConnectionUrl = null;

  if (activeQueueConnection) {
    activeQueueConnection.disconnect();
  }
  if (activeHealthConnection) {
    activeHealthConnection.disconnect();
  }
}
