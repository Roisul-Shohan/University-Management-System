import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next();
  };
};

export default validateRequest;