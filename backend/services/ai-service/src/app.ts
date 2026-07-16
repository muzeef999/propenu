import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import chatRoutes from "./routes/chat.routes";
import { memoryMiddleware } from "./middlewares/memory.middleware";

const app = express();

app.use(cors());

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());


app.get("/health", (_, res) => {
  return res.json({
    success: true,
    message: "AI Service Running",
    service: "ai-service",
  });
});

app.use("/api/chat", memoryMiddleware, chatRoutes);
app.use("/api/chatbot", memoryMiddleware, chatRoutes);


export default app;
