import type { RequestHandler } from "express";
import { z } from "zod";

// validate(schema) returns a middleware that checks req.body against a Zod schema.
// Bad input  -> 400 with what's wrong, and the route handler never runs.
// Good input -> req.body is replaced with Zod's cleaned-up copy (trimmed, lowercased,
//               unknown fields removed) and the request moves on with next().
export function validate(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const { formErrors, fieldErrors } = z.flattenError(result.error);
      res.status(400).json({
        error: "Invalid request",
        // Problems with one field, e.g. { password: ["Too small..."] }
        fields: fieldErrors,
        // Problems with the body as a whole, e.g. an unknown key on a strict
        // schema, or a body that isn't a JSON object at all.
        ...(formErrors.length > 0 && { messages: formErrors }),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
