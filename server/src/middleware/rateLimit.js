import rateLimit from "express-rate-limit";

// Both endpoints let a caller test a guessed password against an account — without a
// limit, credential stuffing / brute force is only bounded by network speed. Keyed by
// IP (the default), not email, so it can't be used to lock a specific victim's account.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
