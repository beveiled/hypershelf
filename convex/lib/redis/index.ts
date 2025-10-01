"use node";

import { createClient } from "redis";

export function getClient(url: string, password: string) {
  const redis = createClient({
    url: url,
    password: password,
  });

  redis.connect().catch(err => {
    console.error("Redis connection error", err);
  });

  return redis;
}
