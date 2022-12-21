import express, { Router } from "express";
import { validate } from "@middleware/validate";
import { postController } from "@controller/postController";
import { validateToken } from "@middleware/jwt";
import {
  getPostSchema,
  insertPostSchema,
  searchPostSchema,
  updatePostReactionSchema,
} from "@common/vaidation";

const postRouter: Router = express.Router();

postRouter.post(
  "/",
  validateToken,
  validate(insertPostSchema, ["body"]),
  postController.insertPost
);

postRouter.get(
  "/",
  validateToken,
  validate(getPostSchema, ["query"]),
  postController.getPost
);

postRouter.get(
  "/search",
//   validateToken,
  validate(searchPostSchema, ["query"]),
  postController.searchPost
);

postRouter.post(
  "/updateReaction",
  validateToken,
  validate(updatePostReactionSchema, ["body"]),
  postController.updatePostReaction
);

postRouter.get(
  "/",
  // validateToken,
  validate(getPostSchema, ["query"]),
  postController.getPost
);

postRouter.get(
  "/:id_post",
  // validateToken,
  postController.getById
);

postRouter.patch(
  "/:id_post",
  // validateToken,
  validate(insertPostSchema, ["body"]),
  postController.updatePost
);

postRouter.delete("/:id_post", validateToken, postController.deletePost);

export default postRouter;
