import express, { Router } from "express";
import { validate } from "@middleware/validate";
import { handleSaveFile, upload } from "@middleware/file";
import { validateToken } from "@middleware/jwt";
import mediaController from "@controller/mediaController";
import { mediaUploadSchema } from "@common/vaidation";
const mediaRouter: Router = express.Router();

mediaRouter.post(
  "/upload",
  validateToken,
  upload.array("files"),
  validate(mediaUploadSchema, ["files"]),
  handleSaveFile,
  mediaController.handleUpload
);

export default mediaRouter;
