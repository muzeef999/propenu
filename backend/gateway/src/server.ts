import express, { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

const PAYMENT_SERVICE_URL  = process.env.PAYMENT_SERVICE_URL  || "";
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || "";
const USER_SERVICE_URL     = process.env.USER_SERVICE_URL     || "";

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


const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map(s => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true);
    const norm = origin.replace(/\/+$/, "");
    if (allowed.includes(norm)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 600,
};



app.use(cors(corsOptions));
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
      error(err: any, _req: any, res: any) {
        // Keep this loosely typed to satisfy v3's types across Node versions
        try {
          if (!res.headersSent && typeof res.writeHead === "function") {
            res.writeHead(502, { "Content-Type": "application/json" });
          }
          if (typeof res.end === "function") {
            res.end(JSON.stringify({ error: "Bad gateway", message: String(err?.message || err) }));
          }
        } catch (e) {
          // swallow
        }
        // Log after responding to avoid broken pipe
        console.error("Proxy error:", err?.message || err);
      },
      // Optional hook if you ever want to add headers to upstream requests:
      // proxyReq(proxyReq, _req, _res) {
      //   proxyReq.setHeader("x-gateway", "propenu");
      // },
    },
  });
}

// Mount once per service. No stripPrefix argument.
app.use("/api/payment",   makeProxy(PAYMENT_SERVICE_URL));
app.use("/api/properties", makeProxy(PROPERTY_SERVICE_URL));
app.use("/api/users",      makeProxy(USER_SERVICE_URL));

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
  console.log(
    "Allowed origins:",
    allowed.length ? allowed : "(none)"
  );
  console.log("Service URLs:", {
    PAYMENT_SERVICE_URL,
    PROPERTY_SERVICE_URL,
    USER_SERVICE_URL,
  });
});
