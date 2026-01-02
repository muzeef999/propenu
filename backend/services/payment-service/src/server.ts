import express from "express";
import dotenv from "dotenv";
dotenv.config();
import paymentRoutes from "../src/routes/paymentRoutes";
import { connectDB } from "./config/db";
import planRoutes from "./routes/planRoute";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 4002;

async function start() {
    
  try {

    await connectDB();

    app.get("/", (req, res) => {
      res.json({ message: "Payment Service is running" });
    });

    app.use("/api/payments", paymentRoutes);
    app.use("/api/payments/plans", planRoutes);

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`payment Service running on 0.0.0.0:${PORT}`);
    });

  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }

}


start();
