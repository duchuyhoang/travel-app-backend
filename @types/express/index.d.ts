import { Client } from "pg";
import express from "express";
import { UserInfo } from "@models/User";
declare global {
  namespace Express {
    interface Request {
      client: Client;
      user?: UserInfo;
    }
  }
}
