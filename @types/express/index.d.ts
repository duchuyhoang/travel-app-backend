import { Client } from "pg";
import express from "express";
import { UserInfo } from "@models/User";
import type { RedisClientType } from "@common/redisConnection";
declare global {
  namespace Express {
    interface Request {
      client: Client;
      redisClient: RedisClientType;
      user?: UserInfo;
    }
  }
}
