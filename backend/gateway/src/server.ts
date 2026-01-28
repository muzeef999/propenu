import express, { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ quiet: true });

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "";
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || "";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "";

if (!PAYMENT_SERVICE_URL || !PROPERTY_SERVICE_URL || !USER_SERVICE_URL) {
  console.error("❌ Missing service URL(s). Check your .env:");
  console.error({
    PAYMENT_SERVICE_URL,
    PROPERTY_SERVICE_URL,
    USER_SERVICE_URL,
  });
  process.exit(1);
}

app.set("trust proxy", true);

// ===== CORS (FIXED & SIMPLE) =====

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / curl

      const cleanOrigin = origin.replace(/\/+$/, "");

      if (allowed.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(null, false); // ❗ do NOT throw error
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 👇 very important for browser preflight
app.use(cors());

app.use(morgan("dev"));

function makeProxy(target: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 30_000,
    timeout: 30_000,

    // Preserve the full original path (includes the mount prefix)
    pathRewrite: (_path, req) => (req as any).originalUrl,

    // http-proxy-middleware v3 event API
    on: {
      error(err: any, req: any, res: any) {
        try {
          res.setHeader(
            "Access-Control-Allow-Origin",
            req.headers.origin || "*",
          );
          res.setHeader("Access-Control-Allow-Credentials", "true");

          if (!res.headersSent) {
            res.writeHead(502, { "Content-Type": "application/json" });
          }

          res.end(
            JSON.stringify({ error: "Bad gateway", message: err.message }),
          );
        } catch {}

        console.error("Proxy error:", err.message);
      },

      // Optional hook if you ever want to add headers to upstream requests:
      // proxyReq(proxyReq, _req, _res) {
      //   proxyReq.setHeader("x-gateway", "propenu");
      // },
    },
  });
}

// Mount once per service. No stripPrefix argument.
app.use("/api/payments", makeProxy(PAYMENT_SERVICE_URL));
app.use("/api/properties", makeProxy(PROPERTY_SERVICE_URL));
app.use("/api/users", makeProxy(USER_SERVICE_URL));

app.get("/", (req, res) => {
  res.json({ message: "getway services  is running" });
});

// Simple health endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV,
    services: {
      payments: PAYMENT_SERVICE_URL,
      properties: PROPERTY_SERVICE_URL,
      users: USER_SERVICE_URL,
    },
  });
});

// 404 for anything else
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Start server
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ Gateway running on : ${PORT}`);
  console.log("Allowed origins:", allowed.length ? allowed : "(none)");
  console.log("Service URLs:", {
    PAYMENT_SERVICE_URL,
    PROPERTY_SERVICE_URL,
    USER_SERVICE_URL,
  });
});
