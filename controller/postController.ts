import { Client, DatabaseError, QueryResult } from "pg";
import { NextFunction, Request, Response } from "express";
import { IPostPayload, Post, DBPost } from "@models/Post";
import { PostTagDao } from "@daos/PostTagDao";
import { PostDao } from "@daos/PostDao";
import { DEL_FLAG, POST_STATUS, REACTION_TYPE } from "@common/enum";
import {
  convertDataToUpdateQuery,
  getImageSrcFromHTML,
  jsonResponse,
  pagination,
  wrapperAsync,
} from "@helpers/index";
import { POST_PREFIX, STATUS_CODE } from "@common/constants";
import { DBError } from "@models/DBError";
import { TagDao } from "@daos/TagDao";
import { WHERE_OPERATOR } from "@daos/BaseDao";
import { PostReactionDao } from "@daos/PostReactionDao";

// POST_PREFIX
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
    const redisClient = req.redisClient;
    try {
      const increaseViewRs = await postDao.increaseView(id_post);
      if (increaseViewRs.rowCount < 1) {
        return jsonResponse(res, "Ok", STATUS_CODE.SUCCESS, {
          data: null,
        });
      }

      const [cachedPost] = await wrapperAsync(
        redisClient.get(`${POST_PREFIX}${id_post}`)
      );

      if (cachedPost) {
        const parseData = JSON.parse(cachedPost);
        return jsonResponse(res, "Ok", STATUS_CODE.SUCCESS, {
          data: { ...parseData, view: increaseViewRs.rows[0]?.view || 0 },
        });
      }

      const rs = await postDao.getById(id_post);
      const data = rs.rows[0];
      const [cachedRs, cachedPostErr] = await wrapperAsync(
        redisClient.set(`${POST_PREFIX}${id_post}`, JSON.stringify(data))
      );

      return jsonResponse(res, "Ok", STATUS_CODE.SUCCESS, {
        data: rs.rows[0] || null,
      });
    } catch (e: any) {
      return jsonResponse(res, "Error", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  insertPost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const redisClient = req.redisClient;
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
      const newPost = {
        ...post,
        tags: postTags,
        author: user,
      };

      const [createCacheRs, errCreateCache] = await wrapperAsync(
        redisClient.set(
          `${POST_PREFIX}${post.id_post}`,
          JSON.stringify(newPost)
        )
      );
      return jsonResponse(res, "Ok", STATUS_CODE.CREATED, newPost);
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
    const redisClient = req.redisClient;

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

      const [createCacheRs, errCreateCache] = await wrapperAsync(
        redisClient.del(`${POST_PREFIX}${id_post}`)
      );

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
    const redisClient = req.redisClient;

    try {
      const result = await postDao.updateOne(
        [{ key: "del_flag", value: DEL_FLAG.DELETED }],
        [{ key: "id_post", value: id_post }]
      );
      const tagUpdateResult = await postTagDao.deletePostTagsPost(
        id_post as string,
        tags
      );

      await wrapperAsync(redisClient.del(`${POST_PREFIX}${id_post}`));
      return jsonResponse(res, "Delete succeed", STATUS_CODE.SUCCESS, {});
    } catch (e: any) {
      console.log(e);

      return jsonResponse(res, "Delete failed", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  searchPost: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const postDao = new PostDao(client);
    try {
      const { limit, offset, search, tags } = req.query;
      console.log(req.query);

      const { rows } = await postDao.searchByStringAndTags(
        search as string,
        tags ? tags.toString().split(",") : []
      );
      return jsonResponse(res, "Succeed", STATUS_CODE.SUCCESS, {
        data: pagination(
          rows,
          parseInt(limit as string),
          parseInt(offset as string)
        ),
      });
    } catch (e: any) {
      console.log(e);

      return jsonResponse(res, "Failed", STATUS_CODE.BAD_REQUEST, e);
    }
  },
  updatePostReaction: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const client: Client = req.client;
    const { id_post, reaction_type, status } = req.body;
    const user = req.user;
    const postReactionDao = new PostReactionDao(client);
    const redisClient = req.redisClient;
    if (!user?.id) {
      return jsonResponse(res, "Bad request", 400);
    }
    try {
      const rs = await postReactionDao.updatePostReaction(
        id_post,
        reaction_type as REACTION_TYPE,
        user?.id.toString(),
        parseInt(status)
      );
      await redisClient.del(`${POST_PREFIX}${id_post}`);
      return jsonResponse(res, "Succeed", 200);
    } catch (e) {
      console.log(e);

      return jsonResponse(res, "Bad request", 400);
    }
  },
};
