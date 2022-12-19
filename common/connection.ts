import { Pool, Client } from "pg";
import dotenv from "dotenv";
// import path from "path";
// dotenv.config({
//   path: path.join(__dirname, ".env.development"),
// });

const client = new Client();

export default client;
