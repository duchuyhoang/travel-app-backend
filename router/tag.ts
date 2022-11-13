import {
  createTagsSchema,
  deleteTagsSchema,
  getTagSchema,
} from "@common/vaidation";
import tagController from "@controller/tagController";
import { validateToken } from "@middleware/jwt";
import { validate } from "@middleware/validate";
import express, { Router } from "express";
const tagRouter: Router = express.Router();

tagRouter.post(
  "/",
  validateToken,
  validate(createTagsSchema, ["body"]),
  tagController.createTags
);

tagRouter.get(
  "/",
  validateToken,
  validate(getTagSchema, ["query"]),
  tagController.getAllTags
);

tagRouter.delete(
  "/",
  validateToken,
  validate(deleteTagsSchema, ["body"]),
  tagController.deleteTags
);

export default tagRouter;
