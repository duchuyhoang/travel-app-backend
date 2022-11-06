import express, { Router } from "express";
import { validate } from "@middleware/validate";
import {
  loginSchema,
  signUpSchema,
  loginSocialSchema,
} from "@common/vaidation";
import authenticationController from "@controller/authenticationController";
const authenticateRouter: Router = express.Router();

authenticateRouter.post(
  "/login",
  validate(loginSchema, "body"),
  authenticationController.login
);

authenticateRouter.post(
  "/loginSocial",
  validate(loginSocialSchema, "body"),
  authenticationController.loginSocial
);

authenticateRouter.post(
  "/signUp",
  validate(signUpSchema, "body"),
  authenticationController.signUp
);
authenticateRouter.get("/l", (req, res) => {
  res.json({ msg: "hello" });
});

export default authenticateRouter;
