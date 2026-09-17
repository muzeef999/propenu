import { RedisOptions } from "ioredis";

/** BullMQ requires maxRetriesPerRequest: null or the worker exits on start. */
export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
};
