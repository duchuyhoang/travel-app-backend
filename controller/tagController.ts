import { STATUS_CODE } from "@common/constants";
import { TagDao } from "@daos/TagDao";
import { convertToBulkInsert, jsonResponse, pagination } from "@helpers/index";
import { NextFunction, Request, Response } from "express";

import { Client, DatabaseError, QueryResult } from "pg";
const tagController = {
  getTagsByPost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const tagDao = new TagDao(client);
    try {
      const rs = await tagDao.bulkInsert([
        { key: "tag_name", value: ["tag1", "tag2"] },
        { key: "tag_description", value: [null, "des2"] },
      ]);
    } catch (e) {
      console.log(e);
    }

    res.json({ msg: "o" });
  },
  getAllTags: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const tagDao = new TagDao(client);
    const { limit, offset } = req.query;
    try {
      const rs = await tagDao.getAll({});

      return jsonResponse(res, "List tag", STATUS_CODE.SUCCESS, {
        ...pagination(
          rs.rows,
          parseInt(limit as string),
          parseInt(offset as string)
        ),
      });
    } catch (e) {
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST, {
        e,
      });
    }
  },
  createTags: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const { tags } = req.body;
    const tagDao = new TagDao(client);

    try {
      const rs = await tagDao.bulkInsert(
        convertToBulkInsert(tags, ["tag_name", "tag_description"]),
        {
          onConflictQuery:
            " ON CONFLICT (tag_name) DO  UPDATE SET tag_description = excluded.tag_description",
        }
      );
      return jsonResponse(res, "Add tags succeed", STATUS_CODE.SUCCESS, {
        data: rs.rows,
      });
    } catch (e) {
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST, {
        e,
      });
    }
  },
  deleteTags: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const { tags } = req.body;
    const tagDao = new TagDao(client);
    try {
      await tagDao.deleteTags(tags);
      return jsonResponse(res, "Delete succeed", STATUS_CODE.SUCCESS);
    } catch (e) {
      return jsonResponse(res, "Delete failed", STATUS_CODE.BAD_REQUEST, { e });
    }
  },
};
export default tagController;
