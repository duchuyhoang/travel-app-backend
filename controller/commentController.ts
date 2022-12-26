import { Client, DatabaseError, QueryResult } from "pg";
import { NextFunction, Request, Response } from "express";
import { jsonResponse, pagination, throwDBError } from "@helpers/index";
import { PostComment, CreatePostCommentPayload } from "@models/PostComment";
import { STATUS_CODE } from "@common/constants";
import { PostCommentDao } from "@daos/PostCommentDao";
import { DEL_FLAG } from "@common/enum";
const commentController = {
  getByPost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const { limit, offset, id_post } = req.query;
    const postCommentDao = new PostCommentDao(client);
    try {
      const { rows } = await postCommentDao.getCommentByPost(
        id_post!?.toString()
      );
      return jsonResponse(res, "Succeed", STATUS_CODE.SUCCESS, {
        data: pagination(
          rows,
          parseInt(limit as string),
          parseInt(offset as string)
        ),
      });
    } catch (e) {
      throwDBError(e as DatabaseError, next);
    }
  },
  insertPostComment: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.user;
    const client = req.client;
    const postCommentDao = new PostCommentDao(client);
    if (!user) {
      return jsonResponse(res, "User doesnt exist", STATUS_CODE.BAD_REQUEST);
    }
    const { id_post, content } = req.body;
    try {
      const rs = await postCommentDao.insertOne({
        id_post: id_post,
        content: content,
        id_user: user.id,
      });
      return jsonResponse(res, "Created", STATUS_CODE.CREATED, {
        data: rs.rows[0],
      });
    } catch (e: any) {
      throwDBError(e as DatabaseError, next);
    }
  },
  editPostComment: async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const client = req.client;
    const postCommentDao = new PostCommentDao(client);
    const { id_comment, content } = req.body;
    try {
      const { rowCount, rows } = await postCommentDao.updateOne(
        [
          {
            key: "content",
            value: content,
          },
        ],
        [
          { key: "id_comment", value: id_comment },
          { key: "id_user", value: user!.id },
        ]
      );
      if (rowCount === 0) {
        return jsonResponse(
          res,
          "Comment doesnt exist or you don't have permission",
          STATUS_CODE.BAD_REQUEST,
          {
            data: null,
          }
        );
      }
      return jsonResponse(res, "Created", STATUS_CODE.CREATED, {
        data: rows[0],
      });
    } catch (e: any) {
      throwDBError(e as DatabaseError, next);
    }
  },
  deletePostComment: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.user;
    const client = req.client;
    const postCommentDao = new PostCommentDao(client);
    const { id_comment } = req.body;
    try {
      const { rowCount, rows } = await postCommentDao.updateOne(
        [
          {
            key: "del_flag",
            value: DEL_FLAG.DELETED,
          },
        ],
        [
          { key: "id_comment", value: id_comment },
          { key: "id_user", value: user!.id },
        ]
      );
      if (rowCount === 0) {
        return jsonResponse(
          res,
          "Comment doesnt exist or you don't have permission",
          STATUS_CODE.BAD_REQUEST,
          {
            data: null,
          }
        );
      }
      return jsonResponse(res, "Created", STATUS_CODE.CREATED, {
        data: rows[0],
      });
    } catch (e: any) {
      throwDBError(e as DatabaseError, next);
    }
  },
};

export default commentController;
