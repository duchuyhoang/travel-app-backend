import {
  createTagsSchema,
  deleteTagsSchema,
  getTagSchema,
} from "@common/vaidation";
import tagController from "@controller/tagController";
import { validateToken } from "@middleware/jwt";
import { validate } from "@middleware/validate";
import express, { Router } from "express";
import { validateAdmin } from "@middleware/admin.middleware";
const tagRouter: Router = express.Router();

tagRouter.post(
  "/",
  // validateAdmin,
  validate(createTagsSchema, ["body"]),
  tagController.createTags
);

tagRouter.get("/", validate(getTagSchema, ["query"]), tagController.getAllTags);

tagRouter.delete(
  "/",
  validateAdmin,
  validate(deleteTagsSchema, ["body"]),
  tagController.deleteTags
);

export default tagRouter;
