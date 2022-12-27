import { NextFunction, Request, Response } from "express";
import { decodeJWT, signToken } from "@helpers/token";
import { jsonResponse, throwDBError, wrapperAsync } from "@helpers/index";
import { STATUS_CODE, VERIFY_USER_PREFIX } from "@common/constants";
import { UserDao } from "@daos/UserDao";
import MailService from "@services/mail";
import { Client, DatabaseError, QueryResult } from "pg";

const mailController = {
  verifyAccount: async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    const redisClient = req.redisClient;
    const client = req.client;
    const userDao = new UserDao(client);
    try {
      const decodedInfo = decodeJWT(token);
      if (!decodedInfo || typeof decodedInfo === "string") {
        return jsonResponse(res, "Invalid token", STATUS_CODE.BAD_REQUEST);
      }
      const userId = decodedInfo.id;
      const redisRs = await redisClient.get(`${VERIFY_USER_PREFIX}${userId}`);
      if (!redisRs) {
        return jsonResponse(res, "Invalid token", STATUS_CODE.BAD_REQUEST);
      }
      const rs = await userDao.updateOne(
        [
          {
            key: "is_verified",
            value: true,
          },
        ],
        [
          {
            key: "id",
            value: userId,
          },
        ]
      );
      await wrapperAsync(redisClient.del(`${VERIFY_USER_PREFIX}${userId}`));

      return jsonResponse(res, "Verify succeed", STATUS_CODE.SUCCESS);
    } catch (e: any) {
      console.log(e);

      throwDBError(e, next);
    }
  },
  sendVerifyEmail: async (req: Request, res: Response, next: NextFunction) => {
    const redisClient = req.redisClient;
    const client = req.client;
    const userDao = new UserDao(client);
    const user = req.user;
    const mailService = new MailService();
    if (!user)
      return jsonResponse(res, "User not exist", STATUS_CODE.BAD_REQUEST);
    try {
      const mailVerifyToken = signToken(
        {
          id: user.id,
        },
        process.env.MAIL_SECRET,
        {
          expiresIn: parseInt(process.env.MAIL_EXPIRE_TIME as string),
        }
      );
      const [rs, error] = await wrapperAsync(
        redisClient.set(`${VERIFY_USER_PREFIX}${user.id}`, mailVerifyToken, {
          PX: parseInt(process.env.MAIL_EXPIRE_TIME!),
        })
      );
      if (rs) {
        const [_, err] = await wrapperAsync(
          mailService.sendHTMLMail({
            from: process.env.MAIL_USER!,
            subject: "Please verify your mail",
            to: [user.email],
            html: `${process.env.CLIENT_HOST!}/${mailVerifyToken}`,
          })
        );
      }
      jsonResponse(res, "Sent", STATUS_CODE.CREATED, {});
    } catch (e: any) {
      throwDBError(e as DatabaseError, next);
    }
  },
};

export default mailController;
