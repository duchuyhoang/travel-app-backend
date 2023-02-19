import { validateAdmin } from "@middleware/admin.middleware";
import express from "express";
import adminController from "@controller/adminController";
import { validate } from "@middleware/validate";
import { getPostByTimeSchema, getUsersSchema, manipulationPostSchema } from "@common/vaidation";

const adminRouter = express.Router();

adminRouter.get(
  "/users",
  validateAdmin,
  validate(getUsersSchema, ["query"]),

  adminController.getAllUsers
);

adminRouter.delete(
  "/users/:id_user",
  validateAdmin,
  adminController.deleteUser
);

adminRouter.patch(
  "/post/:id_post",
  validateAdmin,
  validate(manipulationPostSchema, ["body"]),
  adminController.manipulationPost
);

adminRouter.get(
  "/postByTime",
  validateAdmin,
  validate(getPostByTimeSchema, ["query"]),
  adminController.countPostByTime
);

export default adminRouter;
