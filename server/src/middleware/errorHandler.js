import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({
      error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid request",
      issues: err.issues,
    });
  }

  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Internal server error" });
}
