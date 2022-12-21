import moduleAlias from "module-alias";
import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV === "DEVELOPMENT") {
  dotenv.config({
    path: path.join(__dirname, ".env.development"),
  });
} else {
  dotenv.config();
  moduleAlias();
}

import express, { Express, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";

import userRouter from "@router/user";
import mediaRouter from "@router/media";
import tagRouter from "@router/tag";
import postRouter from "@router/post";
import { ValidationError } from "@models/ValidationError";
import morgan from "morgan";
import { DBError } from "@models/DBError";
import YAML from "yamljs";
const swaggerDocument = YAML.load("./swagger.yaml");
import swaggerUi from "swagger-ui-express";
import { MulterError } from "multer";
import { UPLOAD_FOLDER } from "@common/constants";

import client from "./common/connection";
import redisClient from "./common/redisConnection";

const runServer = async () => {
  const port = process.env.PORT || 3002;

  const app: Express = express();
  await client.connect();
  await redisClient.connect();
  try {
    app.use(express.static(path.join(__dirname, "assets")));
    app.use(`/${UPLOAD_FOLDER}`, express.static(UPLOAD_FOLDER));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());
    app.use(morgan("combined"));
    app.use((req, res, next) => {
      req.client = client;
      req.redisClient = redisClient;
      next();
    });
    app.use("/user", userRouter);
    app.use("/media", mediaRouter);
    app.use("/tag", tagRouter);
    app.use("/post", postRouter);

    app.get("/hello", (req, res) => {
      res.json({ mes: "xxx" });
    });
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.use(
      (
        error: ValidationError | DBError | MulterError,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        console.log(error);
        let errors: Array<any> = [];
        if (error instanceof MulterError) {
          errors.push({ message: "Error upload file" });
        } else {
          if (error?.getErrorList) errors = error?.getErrorList();
        }
        res.status(400).json({
          errors,
          status: 400,
          message: error.message,
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
