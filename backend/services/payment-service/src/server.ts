import express from "express";
import dotenv from "dotenv";
import { seedPlans } from "./routes/seedsRoute";
import { connectDB } from "./config/db";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 4002;

async function start() {
  try {
    await connectDB();

    app.get("/", (req, res) => {
      res.json({ message: "Payment Service is running" });
    });


    app.use("/api/payment/seeds", seedPlans);


    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`payment Service running on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}
start();
