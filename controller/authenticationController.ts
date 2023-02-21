import { Client, DatabaseError, QueryResult } from "pg";
import cryto from "crypto";
import { NextFunction, Request, Response } from "express";
import {
  FORGET_EMAIL_PREFIX,
  STATUS_CODE,
  VERIFY_USER_PREFIX,
} from "@common/constants";
import {
  jsonResponse,
  throwDBError,
  log,
  convertDataToUpdateQuery,
  getFileName,
  wrapperAsync,
} from "@helpers/index";
import {
  CreateUserPayload,
  ILoginSocial,
  LoginPayload,
  User,
  UserInfo,
} from "@models/User";
import { UserDao } from "@daos/UserDao";
import { AUTH_METHOD, PERMISSION } from "@common/enum";
import { DBError } from "@models/DBError";
import { getUserSocialInfo, SocialData } from "@services/socialLogin";
import { signToken } from "@helpers/token";
import MailService from "@services/mail";

const authenticationController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as LoginPayload;
    const client: Client = req.client;
    const userDao = new UserDao(client);
    try {
      const users: QueryResult<User> = await userDao.getUserByEmailAndMethod(
        email,
        AUTH_METHOD.PASSWORD
      );
      if (users.rowCount === 0) {
        return jsonResponse(
          res,
          "Email or password is incorrect",
          STATUS_CODE.UNAUTHORIZED
        );
      }
      const user = users.rows[0];
      const hashedPassword = cryto
        .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
        .toString("hex");
      const { password_hash, salt, ...info } = user;

      if (hashedPassword !== password_hash)
        return jsonResponse(
          res,
          "Email or password is incorrect",
          STATUS_CODE.UNAUTHORIZED
        );

      return jsonResponse(res, "Succeed", STATUS_CODE.SUCCESS, {
        accessToken: signToken(info),
      });
    } catch (e) {
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST);
    }
  },
  signUp: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const redisClient = req.redisClient;
    const userDao = new UserDao(client);
    const {
      email,
      password = "",
      info = null,
      mobile = null,
      name,
    } = req.body as CreateUserPayload;
    const mailService = new MailService();
    const avatar = req.file ? getFileName(req.file) : null;

    const salt = cryto.randomBytes(16).toString("hex");

    const hashedPassword = cryto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");
    try {
      const result = await userDao.signUp({
        email,
        info: info || null,
        mobile: mobile || null,
        name,
        password_hash: hashedPassword,
        avatar,
        permission: PERMISSION.USER,
        method: AUTH_METHOD.PASSWORD,
        salt,
        is_verified: false,
      });

      const insertedUser = result.rows[0];
      const mailVerifyToken = signToken(
        {
          id: insertedUser.id,
        },
        process.env.MAIL_SECRET,
        {
          expiresIn: parseInt(process.env.MAIL_EXPIRE_TIME as string),
        }
      );
      const [rs, error] = await wrapperAsync(
        redisClient.set(
          `${VERIFY_USER_PREFIX}${insertedUser.id}`,
          mailVerifyToken,
          {
            PX: parseInt(process.env.MAIL_EXPIRE_TIME!),
          }
        )
      );

      if (rs) {
        const [_, err] = await wrapperAsync(
          mailService.sendHTMLMail({
            from: process.env.MAIL_USER!,
            subject: "Please verify your mail",
            to: [email],
            html: `${process.env.CLIENT_HOST!}/${mailVerifyToken}`,
          })
        );
        console.log("err send mail", err);
      }

      jsonResponse(res, "Created", STATUS_CODE.CREATED, {});
    } catch (e) {
      throwDBError(e as DatabaseError, next);
    }
  },
  loginSocial: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const { accessToken, method } = req.body as ILoginSocial;
    const userDao = new UserDao(client);
    try {
      const data: SocialData = await getUserSocialInfo(accessToken, method);
      const { email } = data;
      const updateUserResult = await userDao.updateOne(
        convertDataToUpdateQuery(data),
        convertDataToUpdateQuery({
          email,
          method,
        }),
        { remainFieldIfNull: true }
      );

      if (updateUserResult.rowCount === 0) {
        const insertedUserResult = await userDao.insertOne({
          ...data,
          permission: PERMISSION.USER,
          method,
        });
        const insertedUser = insertedUserResult.rows[0];
        if (insertedUser) {
          const { password_hash, salt, ...info } = insertedUser;
          return jsonResponse(res, "Succeed", STATUS_CODE.SUCCESS, {
            accessToken: signToken(info),
          });
        } else {
          next(new DBError("Create user failed", []));
        }
      }

      const updatedUser = updateUserResult.rows[0];
      const { password_hash, salt, ...info } = updatedUser;
      return jsonResponse(res, "Succeed", STATUS_CODE.SUCCESS, {
        accessToken: signToken(info),
      });
    } catch (e) {
      log(e);
      next(new DBError("Login social failed", []));
    }
  },
  edit: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const userDao = new UserDao(client);
    const {
      info = null,
      mobile = null,
      name = null,
    } = req.body as CreateUserPayload;

    const avatar = req.file ? getFileName(req.file) : null;
    const curUser = req.user;
    if (!curUser || curUser.method !== AUTH_METHOD.PASSWORD)
      return jsonResponse(res, "Cannot edit user", STATUS_CODE.BAD_REQUEST);
    try {
      const result = await userDao.updateOne(
        [
          { key: "info", value: info || null },
          { key: "mobile", value: mobile || null },
          { key: "name", value: name || null },
          { key: "avatar", value: avatar },
        ],
        [
          {
            key: "id",
            value: curUser.id,
          },
        ],
        {
          remainFieldIfNull: true,
        }
      );
      if (result.rowCount === 0)
        return jsonResponse(res, "User doesn't exist", STATUS_CODE.BAD_REQUEST);
    } catch (e) {
      return jsonResponse(res, "User doesn't exist", STATUS_CODE.BAD_REQUEST);
    }
    return jsonResponse(res, "Edit succeed", STATUS_CODE.SUCCESS);
  },
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;
    const currentUser = req.user;
    const client: Client = req.client;
    const userDao = new UserDao(client);
    try {
      const users: QueryResult<User> = await userDao.getUserByEmailAndMethod(
        currentUser?.email!,
        AUTH_METHOD.PASSWORD
      );
      if (users.rowCount === 0) {
        return jsonResponse(
          res,
          "Email or password is incorrect",
          STATUS_CODE.UNAUTHORIZED
        );
      }
      const user = users.rows[0];
      const hashedPassword = cryto
        .pbkdf2Sync(oldPassword, user.salt, 1000, 64, "sha512")
        .toString("hex");
      const { password_hash, salt, ...info } = user;

      if (hashedPassword !== password_hash)
        return jsonResponse(
          res,
          "Email or password is incorrect",
          STATUS_CODE.UNAUTHORIZED
        );

      const newHashPassword = cryto
        .pbkdf2Sync(newPassword, user.salt, 1000, 64, "sha512")
        .toString("hex");

      const updateRs = await userDao.updateOne(
        [
          {
            key: "password_hash",
            value: newHashPassword,
          },
        ],
        [
          {
            key: "id",
            value: currentUser?.id,
          },
        ]
      );
      return jsonResponse(res, "Update password succeed", STATUS_CODE.SUCCESS);
    } catch (e) {
      return jsonResponse(
        res,
        "Update password failed",
        STATUS_CODE.BAD_REQUEST
      );
    }
  },
  sendForgetEmail: async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const client: Client = req.client;
    const userDao = new UserDao(client);
    const redisClient = req.redisClient;
    const mailService = new MailService();

    try {
      const { rows } = await userDao.getAll({
        wheres: [
          {
            key: "email",
            value: email,
          },
          {
            key: "method",
            value: AUTH_METHOD.PASSWORD,
          },
        ],
      });
      if (rows.length === 0) {
        return jsonResponse(
          res,
          "Email not exist in system",
          STATUS_CODE.BAD_REQUEST
        );
      } else {
        const user: UserInfo = rows[0];
        const forgetEmailToken = signToken(
          {
            start: new Date().getTime(),
          },
          process.env.MAIL_FORGET_EMAIL_SECRET,
          {
            expiresIn: parseInt(process.env.MAIL_EXPIRE_TIME as string),
          }
        );
        const [rs, error] = await wrapperAsync(
          redisClient.set(
            `${FORGET_EMAIL_PREFIX}${forgetEmailToken}`,
            JSON.stringify(user),
            {
              PX: parseInt(process.env.MAIL_FORGET_EMAIL_EXPIRE!),
            }
          )
        );

        if (rs) {
          const [_, err] = await wrapperAsync(
            mailService.sendHTMLMail({
              from: process.env.MAIL_USER!,
              subject: "Access this link to change your password",
              to: [user.email],
              html: `${process.env
                .CLIENT_FORGET_EMAIL_HOST!}/${forgetEmailToken}`,
            })
          );
        }
        jsonResponse(res, "Sent", STATUS_CODE.CREATED, {});
      }
    } catch (e) {
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST);
    }
  },
  forgetPasswordHandler: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { token, password } = req.body;
    const client: Client = req.client;
    const userDao = new UserDao(client);
    const redisClient = req.redisClient;
    try {
      const [rs, error] = await wrapperAsync(
        redisClient.get(`${FORGET_EMAIL_PREFIX}${token}`)
      );
      console.log(rs);
      if (rs) {
        const user = JSON.parse(rs);
        console.log(user);
        if (user.id) {
          const salt = cryto.randomBytes(16).toString("hex");
          await wrapperAsync(redisClient.del(`${FORGET_EMAIL_PREFIX}${token}`));

          const hashedPassword = cryto
            .pbkdf2Sync(password, salt, 1000, 64, "sha512")
            .toString("hex");
          const { rowCount } = await userDao.updateOne(
            [
              {
                key: "password_hash",
                value: hashedPassword,
              },
              {
                key: "salt",
                value: salt,
              },
            ],
            [
              {
                key: "id",
                value: user.id,
              },
            ]
          );
          console.log("count ", rowCount);

          if (rowCount > 0) {
            return jsonResponse(
              res,
              "Change password succeed",
              STATUS_CODE.SUCCESS
            );
          } else {
            return jsonResponse(
              res,
              "Unexpected error",
              STATUS_CODE.BAD_REQUEST
            );
          }
        }
      }
      return jsonResponse(res, "Token is not exist", STATUS_CODE.BAD_REQUEST);
    } catch (e) {
      console.log(e);
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST);
    }
  },
  getUserInfo: async (req: Request, res: Response, next: NextFunction) => {
    const client: Client = req.client;
    const userDao = new UserDao(client);
    const user = req.user;
    if (!user)
      return jsonResponse(
        res,
        "User doesnt exist",
        STATUS_CODE.BAD_REQUEST,
        {}
      );
    try {
      const { rows } = await userDao.getAll({
        wheres: [
          {
            key: "id",
            value: user?.id,
          },
        ],
      });
      if (rows.length === 0)
        return jsonResponse(
          res,
          "User doesnt exist",
          STATUS_CODE.BAD_REQUEST,
          {}
        );
      const { password_hash, salt, ...userInfo } = rows[0];
      return jsonResponse(res, "Succeed", STATUS_CODE.SUCCESS, {
        data: userInfo,
      });
    } catch (e) {
      return jsonResponse(res, "Unexpected error", STATUS_CODE.BAD_REQUEST, {});
    }
  },
};

export default authenticationController;
