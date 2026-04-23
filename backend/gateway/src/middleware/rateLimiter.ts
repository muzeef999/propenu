import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please slow down.",
  },
  skip: (req) => req.path === "/health",
});