import mailController from "@controller/mailController";
import express, { Router } from "express";
import { validateToken } from "@middleware/jwt";
import { validate } from "@middleware/validate";
import { verifyEmailSchema } from "@common/vaidation";

const mailRouter: Router = express.Router();

mailRouter.post(
  "/send-verify-mail",
  validateToken,
  mailController.sendVerifyEmail
);

mailRouter.post(
  "/verify-email",
  validateToken,
  validate(verifyEmailSchema, ["body"]),
  mailController.verifyAccount
);

export default mailRouter;
