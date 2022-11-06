import { Pool, Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new Client();

export default client;
