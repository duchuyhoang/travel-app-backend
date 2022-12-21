import { createClient, RedisScripts } from "redis";

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
export default client;
export type RedisClientType = typeof client;
