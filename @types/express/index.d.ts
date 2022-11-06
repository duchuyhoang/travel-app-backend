import { Client } from "pg";
import express from "express";
declare global {
  namespace Express {
    interface Request {
      client: Client;
    }
  }
}
