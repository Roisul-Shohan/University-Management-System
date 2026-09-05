import { ZodType} from "zod";
import { Request, Response, NextFunction } from "express";

const validateRequest =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
   
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next();
  };

export default validateRequest;