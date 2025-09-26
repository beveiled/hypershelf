import {
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisScripts,
} from "redis";

export type RedisClient = RedisClientType<
  RedisDefaultModules,
  RedisFunctions,
  RedisScripts
>;
