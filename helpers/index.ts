import { DB_ERROR_MESSAGES } from "@common/constants";
import { Key_And_Value } from "@daos/BaseDao";
import { DBError } from "@models/DBError";
import { NextFunction, Response } from "express";
import { DatabaseError } from "pg";
import { inspect } from "util";

export const jsonResponse = (
  res: Response,
  message: string,
  statusCode: number,
  data?: object
) => {
  return res.status(statusCode).json({
    message,
    ...(data || {}),
  });
};

export const throwDBError = (err: DatabaseError, next: NextFunction) => {
  next(
    new DBError(DB_ERROR_MESSAGES[err.code || ""] || "Error", [
      {
        field: err.constraint || "",
        message: err.detail!,
      },
    ])
  );
};

export const convertUndefinedFieldToNull = (obj: { [key: string]: any }) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) obj[key] = null;
  });
  return obj;
};

export const log = (data: any) => {
  console.log(inspect(data, { showHidden: false, depth: null, colors: true }));
};

export const convertDataToUpdateQuery = (data: {
  [key: string]: any;
}): Array<Key_And_Value> => {
  return Object.entries(data).map(([key, value]) => ({
    key,
    value,
  }));
};

export function get(obj: any, path: string) {
  var paths = path.split("."),
    current = obj,
    i;

  for (i = 0; i < paths.length; ++i) {
    if (current[paths[i]] == undefined) {
      return undefined;
    } else {
      current = current[paths[i]];
    }
  }
  return current;
}
