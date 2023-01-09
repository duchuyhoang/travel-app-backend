import { STATUS_CODE } from "@common/constants";
import { PERMISSION } from "@common/enum";
import { NextFunction, Request, Response } from "express";
import { jsonResponse } from "@helpers/index";
import jwt from "jsonwebtoken";
import { UserInfo } from "@models/User";
export const validateAdmin = (
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
    return jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
  }
  jwt.verify(token, process.env.ACCESS_SECRET!, (error) => {
    if (error)
      return jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});
    else {
      const info: any = jwt.decode(token);

      if (!info || info?.exp * 1000 < Date.now())
        return jsonResponse(res, "Unauthorized", STATUS_CODE.UNAUTHORIZED, {});

      if (info) {
        if (info.permission !== PERMISSION.ADMIN)
          return jsonResponse(res, "Fobbiden", STATUS_CODE.FORBIDDEN, {});

        req.user = info as UserInfo;
      }
      next();
    }
  });
};
