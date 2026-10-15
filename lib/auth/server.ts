import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { z } from "zod";

const neonAuthEnvSchema = z.object({
  NEON_AUTH_BASE_URL: z.url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
});

let instance: ReturnType<typeof createNeonAuth> | null = null;

// Lazily created so a missing variable fails the request instead of the production build.
export function neonAuth() {
  if (!instance) {
    const env = neonAuthEnvSchema.parse(process.env);
    instance = createNeonAuth({
      baseUrl: env.NEON_AUTH_BASE_URL,
      cookies: { secret: env.NEON_AUTH_COOKIE_SECRET },
    });
  }
  return instance;
}
