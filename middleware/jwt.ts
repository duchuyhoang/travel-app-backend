import { STATUS_CODE } from "@common/constants";
import { jsonResponse } from "@helpers/index";
import { UserInfo } from "@models/User";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req?.headers["authorization"]?.split(" ") || [];
  const token =
    authorizationHeader[0] === "Bearer" && authorizationHeader[1]
      ? authorizationHeader[1]
      : null;
  if (!token) {
    jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
    return;
  }
  jwt.verify(token, process.env.ACCESS_SECRET!, (error) => {
    if (error) jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
    else {
      const info = jwt.decode(token);
      if (info) req.user = info as UserInfo;
      next();
    }
  });
};
