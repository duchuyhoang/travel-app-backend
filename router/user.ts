import express, { Router } from "express";
import { validate } from "@middleware/validate";

import {
  loginSchema,
  signUpSchema,
  loginSocialSchema,
  editProfileSchema,
  editPasswordSchema,
  forgetEmailSchema,
  editForgotPasswordSchema,
} from "@common/vaidation";
import authenticationController from "@controller/authenticationController";
import { validateToken } from "@middleware/jwt";
import { handleSaveFile, upload } from "@middleware/file";
const userRouter: Router = express.Router();

userRouter.post(
  "/login",
  validate(loginSchema, ["body"]),
  authenticationController.login
);

userRouter.post(
  "/loginSocial",
  validate(loginSocialSchema, ["body"]),
  authenticationController.loginSocial
);

userRouter.post(
  "/signUp",
  upload.single("avatar"),
  validate(signUpSchema, ["body", "file"]),
  handleSaveFile,
  authenticationController.signUp
);

userRouter.patch(
  "/edit",
  validateToken,
  upload.single("avatar"),
  validate(editProfileSchema, ["body", "file"]),
  handleSaveFile,
  authenticationController.edit
);

userRouter.patch(
  "/changePassword",
  validateToken,
  validate(editPasswordSchema, ["body"]),
  authenticationController.changePassword
);

userRouter.post(
  "/sendForgetEmail",
  validate(forgetEmailSchema, ["body"]),
  authenticationController.sendForgetEmail
);

userRouter.post(
  "/changeForgotPassword",
  validate(editForgotPasswordSchema, ["body"]),
  authenticationController.forgetPasswordHandler
);

userRouter.get(
  "/userInfo",
  validateToken,
  authenticationController.getUserInfo
);

export default userRouter;
