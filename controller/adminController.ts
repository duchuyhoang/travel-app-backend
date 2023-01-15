import { STATUS_CODE } from "@common/constants";
import { POST_STATUS } from "@common/enum";
import { PostDao } from "@daos/PostDao";
import { UserDao } from "@daos/UserDao";
import { NextFunction, Request, Response } from "express";
import { jsonResponse, pagination } from "@helpers/index";

const adminController = {
  getAllUsers: async (req: Request, res: Response, next: NextFunction) => {
    const client = req.client;
    const { limit, offset } = req.query;
    const currentAdmin = req.user;
    const userDao = new UserDao(client);
    const { rows } = await userDao.getAll({
      fields: [
        "id",
        "name",
        "email",
        "mobile",
        "info",
        "avatar",
        "permission",
        "method",
        "is_verified",
      ],
      wheres: [
        {
          key: "email",
          value: currentAdmin?.email,
          notEqual: true,
        },
      ],
    });

    return jsonResponse(
      res,
      "Succeed",
      STATUS_CODE.SUCCESS,
      pagination(rows, parseInt(limit as string), parseInt(offset as string))
    );
  },
  deleteUser: async (req: Request, res: Response, next: NextFunction) => {
    const userDao = new UserDao(req.client);
    const { id_user } = req.params;
    const curAdmin = req.user;
    try {
      const { rowCount, rows } = await userDao.deleteUser(
        (curAdmin?.id as number).toString(),
        id_user
      );
      if (rowCount === 0) {
        return jsonResponse(res, "User doesn't exist", STATUS_CODE.BAD_REQUEST);
      } else {
        return jsonResponse(res, "Delete user succeed", STATUS_CODE.SUCCESS, {
          data: rows[0],
        });
      }
    } catch (e) {
      console.log(e);

      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST);
    }
  },
  manipulationPost: async (req: Request, res: Response, next: NextFunction) => {
    const client = req.client;
    const postDao = new PostDao(client);
    const { id_post } = req.params;
    const { status } = req.body;
    try {
      const { rows } = await postDao.updateOne(
        [
          {
            key: "status",
            value: status || POST_STATUS.APPROVED,
          },
        ],
        [{ key: "id_post", value: id_post }]
      );
      if (rows.length === 0)
        return jsonResponse(res, "Post doesn't exist", STATUS_CODE.BAD_REQUEST);
      else {
        return jsonResponse(res, "Update post succeed", STATUS_CODE.SUCCESS, {
          data: rows[0],
        });
      }
    } catch (e) {
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST);
    }
  },
};
export default adminController;
