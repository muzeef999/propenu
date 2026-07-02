import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

const app = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Ticket Service",
    message: "Welcome to Propenu Ticket Service 🚀",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Running",
    service: "Ticket Service",
    timestamp: new Date(),
  });
});

export default app;