import type { RequestHandler } from "express";
import { z } from "zod";

// validate(schema) returns a middleware that checks req.body against a Zod schema.
// Bad input  -> 400 with which fields are wrong, and the route handler never runs.
// Good input -> req.body is replaced with Zod's cleaned-up copy (trimmed, lowercased,
//               unknown fields removed) and the request moves on with next().
export function validate(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Invalid request",
        fields: z.flattenError(result.error).fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
