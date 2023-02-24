import express from "express";
import bookmarkController from "@controller/bookmarkController";
import { validateToken } from "@middleware/jwt";
import { validate } from "@middleware/validate";
import { getBookmarkSchema, toggleBookmarkSchema } from "@common/vaidation";

const bookmarkRouter = express.Router();

bookmarkRouter.get(
  "/",
  validateToken,
  validate(getBookmarkSchema, ["query"]),
  bookmarkController.getBookmarkByCurUser
);

bookmarkRouter.get(
  "/isBookmarByCur/:id_post",
  validateToken,
  bookmarkController.isBookmarByCurUse
);

bookmarkRouter.patch(
  "/",
  validateToken,
  validate(toggleBookmarkSchema, ["body"]),
  bookmarkController.toggleBookMark
);

export default bookmarkRouter;
