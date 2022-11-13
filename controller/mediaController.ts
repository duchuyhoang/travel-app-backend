import { Client, DatabaseError, QueryResult } from "pg";
import { NextFunction, Request, Response } from "express";
import { STATUS_CODE, UPLOAD_FOLDER } from "@common/constants";

import {
  jsonResponse,
  throwDBError,
  log,
  convertDataToUpdateQuery,
  getFileName,
  fullUrl,
} from "@helpers/index";

const mediaController = {
  handleUpload: async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files;
    let list: Array<{ url: string }> = [];
    if (Array.isArray(files)) {
      list = files.map((file) => ({
        url: `${fullUrl(req,UPLOAD_FOLDER)}/${file.filename}`,
      }));
    }
    return jsonResponse(res, "List uploads", STATUS_CODE.SUCCESS, {
      list,
    });
  },
};
export default mediaController;
