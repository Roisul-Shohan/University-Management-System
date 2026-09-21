import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as {
      body?: Request["body"];
      params?: Request["params"];
      query?: Request["query"];
    };

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params;
    if (parsed.query !== undefined) {
      Object.defineProperty(req, "query", {
        configurable: true,
        enumerable: true,
        value: parsed.query,
        writable: true,
      });
    }

    next();
  };
};

export default validateRequest;
