import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { attachmentRoutes } from "../modules/attachment";
import { categoryRoutes } from "../modules/category";
import { commentRoutes } from "../modules/comment";
import { dashboardRoutes } from "../modules/dashboard";
import { departmentRoutes } from "../modules/department";
import { ticketRoutes } from "../modules/ticket";

const app = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/tickets", ticketRoutes);
app.use("/api/ticket-attachments", attachmentRoutes);
app.use("/api/ticket-categories", categoryRoutes);
app.use("/api/ticket-comments", commentRoutes);
app.use("/api/ticket-dashboard", dashboardRoutes);
app.use("/api/ticket-departments", departmentRoutes);

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
    status: "Running ",
    service: "Ticket Service",
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default app;
