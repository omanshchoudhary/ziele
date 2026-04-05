export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body || {});
      req.validatedBody = parsed;
      next();
    } catch (error) {
      const message =
        error?.issues?.[0]?.message || error.message || "Invalid request body.";
      res.status(400).json({ error: message });
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query || {});
      req.validatedQuery = parsed;
      next();
    } catch (error) {
      const message =
        error?.issues?.[0]?.message || error.message || "Invalid query params.";
      res.status(400).json({ error: message });
    }
  };
}

