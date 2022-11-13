import { DB_ERROR_MESSAGES, UPLOAD_FOLDER } from "@common/constants";
import { Key_And_Value } from "@daos/BaseDao";
import { DBError } from "@models/DBError";
import { NextFunction, Response, Request } from "express";
import { DatabaseError } from "pg";
import { inspect } from "util";

var url = require("url");

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

export const getFileName = (file: Express.Multer.File) => {
  return `/${UPLOAD_FOLDER}/${file.filename}`;
};

export function fullUrl(req: Request, pathname?: string) {
  return url.format({
    protocol: req.protocol,
    host: req.get("host"),
    pathname: pathname || req.originalUrl,
  });
}
export const convertToBulkInsert = (
  payload: Array<any>,
  fields: Array<string>
) => {
  const data: Array<{
    key: string;
    value: Array<any>;
  }> = [];
  payload.forEach((value) => {
    fields.forEach((field, index) => {
      data[index]
        ? data[index]["value"].push(value[field])
        : (data[index] = {
            key: field,
            value: [value[field]],
          });
    });
  });
  return data;
};

const notNull = (value: any) => {
  return value !== undefined && value !== null && !isNaN(value);
};

export const pagination = (
  list: Array<any>,
  limit?: number,
  offset?: number
) => {
  return {
    data:
      notNull(offset) && notNull(limit)
        ? list.slice(offset!, (offset! + 1) * limit!)
        : list,
    metadata: {
      total: list.length,
      totalPage: notNull(limit) ? Math.ceil(list.length / limit!) : 1,
      page:
        notNull(limit) && notNull(offset)
          ? Math.ceil(offset! / limit!) === 0
            ? 1
            : Math.floor(offset! / limit!) + 1
          : 1,
      limit: limit,
      hasMore:
        notNull(limit) && notNull(offset)
          ? list.length > offset! * limit!
          : false,
    },
  };
};

export function isInDesiredForm(str: any) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}
