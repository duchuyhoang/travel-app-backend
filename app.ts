import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import client from "./common/connection";
import authenticateRouter from "./router/authenticate";
import { ValidationError } from "@models/ValidationError";
import morgan from "morgan";
import { DBError } from "@models/DBError";
dotenv.config();

const runServer = async () => {
  const port = process.env.PORT || 3002;

  const app: Express = express();
  await client.connect();
  try {
    app.use(express.static(path.join(__dirname, "assets")));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());
	app.use(morgan("combined"));
    app.use((req, res, next) => {
      req.client = client;
      next();
    });
    app.use("/auth", authenticateRouter);
    app.get("/hello", (req, res) => {
      res.json({ mes: "xxx" });
    });
    app.use(
      (
        error: ValidationError | DBError,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        res.status(400).json({
          errors: error.getErrorList(),
          status: 400,
		  message:error.message
        });
      }
    );

    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (e) {
    console.log(e);
  }
};

runServer();
