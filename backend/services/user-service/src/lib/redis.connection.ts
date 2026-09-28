import dotenv from "dotenv";
import type { RedisOptions } from "ioredis";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), process.env.ENV_FILE || ".env"),
  quiet: true,
});

function wantsTls(hostname: string, protocol: string): boolean {
  if (protocol === "rediss:") return true;
  if (String(process.env.REDIS_TLS || "").toLowerCase() === "true") return true;
  // Upstash (and similar) require TLS even when URL is redis://
  const host = hostname.toLowerCase();
  return host.includes("upstash.io") || host.includes("redis.cloud");
}

/** BullMQ requires maxRetriesPerRequest: null or the worker exits on start. */
const buildRedisConnection = (): RedisOptions => {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    const parsed = new URL(redisUrl);

    if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
      throw new Error("REDIS_URL must start with redis:// or rediss://");
    }

    const useTls = wantsTls(parsed.hostname, parsed.protocol);

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 15000,
      keepAlive: 10000,
      ...(parsed.username
        ? { username: decodeURIComponent(parsed.username) }
        : {}),
      ...(parsed.password
        ? { password: decodeURIComponent(parsed.password) }
        : {}),
      ...(useTls ? { tls: {} } : {}),
    };
  }

  const host = process.env.REDIS_HOST || "127.0.0.1";
  const useTls =
    String(process.env.REDIS_TLS || "").toLowerCase() === "true" ||
    wantsTls(host, "redis:");

  return {
    host,
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 15000,
    keepAlive: 10000,
    ...(process.env.REDIS_USERNAME
      ? { username: process.env.REDIS_USERNAME }
      : {}),
    ...(process.env.REDIS_PASSWORD
      ? { password: process.env.REDIS_PASSWORD }
      : {}),
    ...(useTls ? { tls: {} } : {}),
  };
};

export const redisConnection = buildRedisConnection();

export function describeRedisTarget(): string {
  const host =
    (redisConnection as any).host ||
    process.env.REDIS_HOST ||
    "unknown";
  const tls = Boolean((redisConnection as any).tls);
  return `${host} (tls=${tls ? "on" : "off"})`;
}
