import { ValidationError } from "@models/ValidationError";
import { NextFunction, Request, Response } from "express";
import * as yup from "yup";

export const validate = (
  schema: yup.ObjectSchema<any, any, any, any>,
  fields: Array<"body" | "query" | "file" | "files">
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const datas = fields.reduce((prev, field) => {
      if (field === "file") {
        const file = req.file;
        return file ? { ...prev, ...{ [file?.fieldname!]: file } } : prev;
      } else if (field === "files") {
        const files = req.files;
        if (Array.isArray(files)) {
          const firstFile = files[0];
          return firstFile
            ? { ...prev, ...{ [firstFile?.fieldname!]: files } }
            : prev;
        } else {
          Object.keys(files!).forEach((key) => {
            if (req.files) (prev as any)[key] = (req.files as any)[key];
          });
        }
      }
      return { ...prev, ...req[field] };
    }, {});
    try {
      await schema.validate(datas, { abortEarly: false });
      next();
    } catch (e: any) {
      next(new ValidationError("Validation error", e.inner));
    }
  };
};
