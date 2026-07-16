import express, { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { Socket } from "net";
import path from "path";
import {
  authLimiter,
  chatbotLimiter,
  globalApiLimiter,
  otpRequestLimiter,
  paymentLimiter,
  propertySearchLimiter,
} from "./middleware/rateLimiter";

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "";
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || "";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "";
const TICKET_SERVICE_URL = process.env.TICKET_SERVICE_URL || "";

if (!PAYMENT_SERVICE_URL || !PROPERTY_SERVICE_URL || !USER_SERVICE_URL || !AI_SERVICE_URL || !TICKET_SERVICE_URL) {
  console.error("❌ Missing service URL(s). Check your .env");
  process.exit(1);
}

const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS ?? 1);

app.set("trust proxy", TRUST_PROXY_HOPS);

// ===================== CORS CONFIG =====================

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // Postman / curl
      const clean = origin.replace(/\/+$/, "");
      if (!allowed.length || allowed.includes(clean)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  })
);

app.use(morgan("dev"));

// ===================== RATE LIMITS =====================

app.use(
  ["/api/users/auth/request-otp", "/api/users/auth/request-otp/create"],
  otpRequestLimiter
);
app.use(
  ["/api/users/auth/verify-otp", "/api/users/auth/verify-otp/create"],
  authLimiter
);
app.use("/api/chatbot", chatbotLimiter);
app.use("/api/properties/search", propertySearchLimiter);
app.use("/api/payments", paymentLimiter);
app.use("/api", globalApiLimiter);

// ===================== PROXY HELPER =====================

function proxy(serviceName: string, target: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 30000,
    timeout: 30000,

    // ✅ preserve full path like /api/users/location
    pathRewrite: (_path, req) => (req as any).originalUrl,

    on: {
      error(err: Error, req, res: Response | Socket) {
        console.error(`❌ ${serviceName} service error:`, err.message);
        if (res instanceof Socket) return;
        if (!res.headersSent) {
          res.status(502).json({
            error: `${serviceName} service down`,
            message:
              serviceName === "AI"
                ? "HomeMate AI service is not running on port 4006. Start backend/services/ai-service and try again."
                : `${serviceName} service is not reachable.`,
          });
        }
      },
    },
  });
}

// ===================== MICROSERVICE ROUTES =====================

app.use("/api/payments", proxy("PAYMENT", PAYMENT_SERVICE_URL));
app.use("/api/properties", proxy("PROPERTY", PROPERTY_SERVICE_URL));
app.use("/api/users", proxy("USER", USER_SERVICE_URL));
app.use("/api/chatbot", proxy("AI", AI_SERVICE_URL));
app.use("/api/tickets", proxy("TICKET", TICKET_SERVICE_URL));
app.use("/api/ticket-attachments", proxy("TICKET", TICKET_SERVICE_URL));
app.use("/api/ticket-categories", proxy("TICKET", TICKET_SERVICE_URL));
app.use("/api/ticket-comments", proxy("TICKET", TICKET_SERVICE_URL));
app.use("/api/ticket-dashboard", proxy("TICKET", TICKET_SERVICE_URL));
app.use("/api/ticket-departments", proxy("TICKET", TICKET_SERVICE_URL));


// ===================== SYSTEM ROUTES  =====================
app.get("/", (_req, res) => {
  res.json({ message: "✅ Gateway running" });
});

app.get("/health", async (_req: Request, res: Response) => {
  let aiReachable = false;

  try {
    const aiResponse = await fetch(`${AI_SERVICE_URL}/health`);
    aiReachable = aiResponse.ok;
  } catch {
    aiReachable = false;
  }

  res.json({
    ok: true,
    services: {
      payments: PAYMENT_SERVICE_URL,
      properties: PROPERTY_SERVICE_URL,
      users: USER_SERVICE_URL,
      ai: {
        url: AI_SERVICE_URL,
        reachable: aiReachable,
      },
      tickets: TICKET_SERVICE_URL,
    },
  });
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ===================== START SERVER  =====================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Gateway running on port ${PORT}`);
  console.log("Allowed origins:", allowed.length ? allowed : "(none)");
  console.log("Services:", {
    PAYMENT_SERVICE_URL,
    PROPERTY_SERVICE_URL,
    USER_SERVICE_URL,
    AI_SERVICE_URL,
    TICKET_SERVICE_URL,
  });
});
