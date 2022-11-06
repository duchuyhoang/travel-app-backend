import { NextFunction, Request, Response } from "express";
import * as yup from "yup";
import { ValidationError } from "@models/ValidationError";
export const validate = (
  schema: yup.ObjectSchema<any, any, any, any>,
  field: "body" | "params"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const data = req[field];
    try {
      await schema.validate(data, { abortEarly: false });
      next();
    } catch (e: any) {
      //   console.log(e);
      //   res.status(400).json({
      //     errors: e.inner,
      //   });
      next(new ValidationError("Validation error", e.inner));
    }
  };
};
