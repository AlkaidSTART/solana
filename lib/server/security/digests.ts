import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function toBuffer(value: string | Uint8Array): Buffer {
  return typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value);
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash("sha256").update(toBuffer(value)).digest("hex");
}

export function hmacSha256Hex(secret: string | Uint8Array, value: string | Uint8Array): string {
  return createHmac("sha256", toBuffer(secret)).update(toBuffer(value)).digest("hex");
}

export function safeEqual(left: string | Uint8Array, right: string | Uint8Array): boolean {
  const leftBytes = toBuffer(left);
  const rightBytes = toBuffer(right);
  const leftDigest = createHash("sha256").update(leftBytes).digest();
  const rightDigest = createHash("sha256").update(rightBytes).digest();
  const equalDigest = timingSafeEqual(leftDigest, rightDigest);

  return leftBytes.length === rightBytes.length && equalDigest;
}

function canonicalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON only supports finite numbers.");
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new TypeError("Canonical JSON cannot contain circular references.");
    }
    seen.add(value);
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index) || value[index] === undefined) {
        throw new TypeError("Canonical JSON arrays cannot contain sparse or undefined entries.");
      }
      result.push(canonicalize(value[index], seen));
    }
    seen.delete(value);
    return result;
  }
  if (typeof value === "object" && value !== null) {
    const prototype = Object.getPrototypeOf(value) as unknown;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Canonical JSON only supports plain objects.");
    }
    if (seen.has(value)) {
      throw new TypeError("Canonical JSON cannot contain circular references.");
    }
    seen.add(value);
    const sorted = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry !== undefined) {
        sorted[key] = canonicalize(entry, seen);
      }
    }
    seen.delete(value);
    return sorted;
  }

  throw new TypeError("Canonical JSON contains an unsupported value.");
}

export function canonicalJsonDigest(value: unknown): string {
  const canonical = JSON.stringify(canonicalize(value, new WeakSet<object>()));
  return sha256Hex(canonical);
}
