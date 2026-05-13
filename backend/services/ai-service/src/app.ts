import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(cors());

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());


app.get("/health", (_, res) => {
  return res.json({
    success: true,
    message: "AI Service Running",
  });
});

app.use("/api/chat", chatRoutes);


export default app;