import { NextFunction, Request, Response } from "express";
import * as yup from "yup";

export const validate = (
  schema: yup.ObjectSchema<any, any, any, any>,
  field: "body" | "params"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[field];
    try {
      schema.validate(data);
      next();
    } catch (e: any) {
      console.log(e);
      res.status(400).json({
        ...e,
      });
    }
  };
};
