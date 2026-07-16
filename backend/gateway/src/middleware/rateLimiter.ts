import rateLimit from "express-rate-limit";

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => req.path === "/health",
};

export const globalApiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again shortly.",
  },
});

export const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait before trying again.",
  },
});

export const otpRequestLimiter = rateLimit({
  ...commonOptions,
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait before requesting another OTP.",
  },
});

export const chatbotLimiter = rateLimit({
  ...commonOptions,
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "HomeMate is receiving too many messages. Please try again in a few minutes.",
  },
});

export const propertySearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 5 * 60 * 1000,
  max: 120,
  message: {
    success: false,
    message: "Too many property searches. Please wait a moment and try again.",
  },
});

export const paymentLimiter = rateLimit({
  ...commonOptions,
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many payment requests. Please wait a moment and try again.",
  },
});
