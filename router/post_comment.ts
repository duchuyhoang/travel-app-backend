import commentController from "@controller/commentController";
import express, { Router } from "express";
import {
  createPostCommentSchema,
  getPostCommentSchema,
  editPostCommentSchema,
  deletePostCommentSchema,
} from "@common/vaidation";
const commentRouter: Router = express.Router();
import { validateToken } from "@middleware/jwt";
import { validate } from "@middleware/validate";

commentRouter.get(
  "/",
  // validateToken,
  validate(getPostCommentSchema, ["query"]),
  commentController.getByPost
);

commentRouter.post(
  "/",
  validateToken,
  validate(createPostCommentSchema, ["body"]),
  commentController.insertPostComment
);

commentRouter.patch(
  "/",
  validateToken,
  validate(editPostCommentSchema, ["body"]),
  commentController.editPostComment
);

commentRouter.delete(
  "/",
  validateToken,
  validate(deletePostCommentSchema, ["body"]),
  commentController.deletePostComment
);

export default commentRouter;
