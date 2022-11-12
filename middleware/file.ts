import { MAX_FILE_SIZE, UPLOAD_FOLDER } from "@common/constants";
import multer, { FileFilterCallback } from "multer";
import { v4 as uuidv4 } from "uuid";
import { ValidationError } from "@models/ValidationError";
import fs from "fs";
import path from "path";
import { NextFunction } from "express";
import { Readable } from "stream";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(UPLOAD_FOLDER)) {
      fs.mkdirSync(UPLOAD_FOLDER);
    }

    cb(null, UPLOAD_FOLDER);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4());
  },
});

export const isImage = (file: Express.Multer.File) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  return mimetype && extname;
};

export const upload = multer({
  storage: multer.memoryStorage(),
  //   limits: {
  //     fileSize: 100,
  //   },
  //   fileFilter(req, file, callback) {
  //     const isPass = isImage(file);
  //     callback(null, false);
  //   },
});

export const handleSaveFile = async (
  req: Express.Request,
  res: Express.Response,
  next: NextFunction
) => {
  if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
  }

  const handleWriteFile = (file: Express.Multer.File) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const newFileName = `${uuidv4()}${ext}`;
    const fileStream = Readable.from(file.buffer);
    const writeStream = fs.createWriteStream(UPLOAD_FOLDER + `/${newFileName}`);
    fileStream.pipe(writeStream);
    return {
      fileName: newFileName,
      ext,
    };
  };

  const isSingle = req.file ? true : false;
  if (isSingle && req.file) {
    const file = req.file;
    const { fileName } = handleWriteFile(file!);
    req.file = { ...req.file, filename: fileName };
  } else if (!isSingle && req.files) {
    const files = req.files;
    if (Array.isArray(files)) {
      req.files = files.map((file) => {
        const { fileName } = handleWriteFile(file!);
        return { ...file, filename: fileName };
      });
    } else {
      req.files = Object.keys(req.files).reduce((prev, key) => {
        const listFiles = (req.files as any)[key];
        return {
          ...prev,
          [key]: listFiles.map((file: Express.Multer.File) => {
            const { fileName } = handleWriteFile(file!);
            return { ...file, filename: fileName };
          }),
        };
      }, {});
    }
  }
  next();
};
