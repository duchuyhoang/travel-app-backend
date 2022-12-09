import { Client, DatabaseError, QueryResult } from "pg";
import { NextFunction, Request, Response } from "express";
import { IPostPayload, Post, DBPost } from "@models/Post";
import { PostTagDao } from "@daos/PostTagDao";
import { PostDao } from "@daos/PostDao";
import { DEL_FLAG, POST_STATUS } from "@common/enum";
import {
  convertDataToUpdateQuery,
  getImageSrcFromHTML,
  jsonResponse,
  pagination,
} from "@helpers/index";
import { STATUS_CODE } from "@common/constants";
import { DBError } from "@models/DBError";
import { TagDao } from "@daos/TagDao";
import { WHERE_OPERATOR } from "@daos/BaseDao";

export const postController = {
  getPost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const postDao = new PostDao(client);
    const { limit, offset } = req.query;
    try {
      const rs = await postDao.getAllPosts();
      return jsonResponse(res, "Ok", STATUS_CODE.SUCCESS, {
        ...pagination(
          rs.rows,
          parseInt(limit as string),
          parseInt(offset as string)
        ),
      });
    } catch (e: any) {
      return jsonResponse(res, "Error", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const postDao = new PostDao(client);
    const { id_post } = req.params;
    try {
      const rs = await postDao.getById(id_post);
      return jsonResponse(res, "Ok", STATUS_CODE.SUCCESS, {
        data: rs.rows[0] || null,
      });
    } catch (e: any) {
      return jsonResponse(res, "Error", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  insertPost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const user = req.user;
    const { tags, ...postPayload }: IPostPayload = req.body;
    const slug = postPayload.title.split(" ").join("-");
    const postTagDao = new PostTagDao(client);
    const tagDao = new TagDao(client);
    const postDao = new PostDao(client);
    const thumbnail = getImageSrcFromHTML(postPayload.content);

    try {
      await client.query("BEGIN");
      const { rows } = await postDao.insertOne({
        ...postPayload,
        slug,
        thumbnail: thumbnail,
        del_flag: DEL_FLAG.EXIST,
        status: POST_STATUS.UNAPPROVED,
        author_id: user?.id,
      });
      const post: DBPost = rows[0];
      if (!post) throw new DBError("Insert failed", []);
      const { rows: insertedPostTags } = await postTagDao.bulkInsert([
        { key: "id_tag", value: tags },
        { key: "id_post", value: new Array(tags.length).fill(post.id_post) },
      ]);

      const { rows: postTags } =
        insertedPostTags.length === 0
          ? { rows: [] }
          : await tagDao.getAll({
              wheres: insertedPostTags.map((pt) => ({
                key: "id_tag",
                value: pt.id_tag,
                operator: WHERE_OPERATOR.OR,
              })),
            });

      await client.query("COMMIT");
      return jsonResponse(res, "Ok", STATUS_CODE.CREATED, {
        ...post,
        tags: postTags,
        author: user,
      });
    } catch (e: any) {
      await client.query("ROLLBACK");
      return jsonResponse(res, "Error", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  updatePost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const { id_post } = req.params;
    const { tags, ...postPayload }: IPostPayload = req.body;
    const postDao = new PostDao(client);
    const postTagDao = new PostTagDao(client);
    const thumbnail = getImageSrcFromHTML(postPayload.content);

    try {
      await client.query("BEGIN");
      const result = await postDao.updateOne(
        convertDataToUpdateQuery({ ...postPayload, thumbnail }),
        [{ key: "id_post", value: id_post }]
      );
      const tagUpdateResult = await postTagDao.updatePostTagsPost(
        id_post as string,
        tags
      );
      await client.query("COMMIT");
      return jsonResponse(res, "Update succeed", STATUS_CODE.SUCCESS, {});
    } catch (e: any) {
      await client.query("ROLLBACK");
      console.log(e);

      return jsonResponse(res, "Update failed", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  deletePost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const { id_post } = req.params;
    const { tags, ...postPayload }: IPostPayload = req.body;
    const postDao = new PostDao(client);
    const postTagDao = new PostTagDao(client);

    try {
      const result = await postDao.updateOne(
        [{ key: "del_flag", value: DEL_FLAG.DELETED }],
        [{ key: "id_post", value: id_post }]
      );
      const tagUpdateResult = await postTagDao.deletePostTagsPost(
        id_post as string,
        tags
      );
      return jsonResponse(res, "Delete succeed", STATUS_CODE.SUCCESS, {});
    } catch (e: any) {
      console.log(e);

      return jsonResponse(res, "Delete failed", STATUS_CODE.BAD_REQUEST, e);
    }
  },
};
