import { STATUS_CODE } from "@common/constants";
import { BookmarkDao } from "@daos/BookmarkDao";
import { NextFunction, Request, Response } from "express";
import { jsonResponse, pagination } from "@helpers/index";
import { Client } from "pg";
import { DEL_FLAG } from "@common/enum";

const bookmarkController = {
  toggleBookMark: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const bookmarkDao = new BookmarkDao(client);
    const user = req.user;
    const { id_post } = req.body;
    if (!user) {
      return jsonResponse(res, "Token expire", STATUS_CODE.UNAUTHORIZED);
    }
    try {
      const { rowCount } = await bookmarkDao.toggleBookmark(
        id_post,
        user?.id.toString()
      );
      console.log(rowCount);
      return jsonResponse(res, "Toggle bookmark succeed", STATUS_CODE.SUCCESS);
    } catch (e) {
      return jsonResponse(
        res,
        "Toggle bookmark failed",
        STATUS_CODE.BAD_REQUEST,
        { data: e }
      );
    }
  },
  getBookmarkByCurUser: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const client: Client = req.client;
    const bookmarkDao = new BookmarkDao(client);
    const user = req.user;
    const { limit, offset } = req.query;
    if (!user) {
      return jsonResponse(res, "Token expire", STATUS_CODE.UNAUTHORIZED);
    }

    try {
      const rs = await bookmarkDao.getBookmarkByCurUser(user?.id.toString());
      return jsonResponse(res, "Ok", STATUS_CODE.SUCCESS, {
        ...pagination(
          rs.rows,
          parseInt(limit as string),
          parseInt(offset as string)
        ),
      });
    } catch (e) {
      return jsonResponse(res, "Failed", STATUS_CODE.BAD_REQUEST);
    }
  },
  isBookmarByCurUse: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id_post } = req.params;
    const client: Client = req.client;
    const bookmarkDao = new BookmarkDao(client);
    const user = req.user;
    try {
      const { rowCount } = await bookmarkDao.getAll({
        wheres: [
          { key: "id_user", value: user!.id },
          { key: "id_post", value: id_post },
          { key: "del_flag", value: DEL_FLAG.EXIST },
        ],
      });
      return jsonResponse(
        res,
        rowCount ? "Ok" : "No",
        rowCount ? STATUS_CODE.SUCCESS : STATUS_CODE.BAD_REQUEST,
        {}
      );
    } catch (e) {
      return jsonResponse(res, "No", STATUS_CODE.BAD_REQUEST, {});
    }
  },
};

export default bookmarkController;
