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
  console.log(token);

  if (!token) {
    return jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
  }
  jwt.verify(token, process.env.ACCESS_SECRET!, (error) => {
    if (error)
      return jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
    else {
      const info: any = jwt.decode(token);

      if (!info || info?.exp * 1000 < Date.now())
        return jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
      console.log(info);

      if (info) req.user = info as UserInfo;
      next();
    }
  });
};
