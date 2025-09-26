import { env } from "@/env";
import { RedisClient } from "./types";
import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
  redis?: RedisClient;
};

const redis: RedisClient =
  globalForRedis.redis ??
  createClient({
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  });

if (!redis.isOpen) {
  redis.connect().catch(err => {
    console.error("Redis connection error", err);
  });
}

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export { redis };
