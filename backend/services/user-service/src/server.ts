import express from "express";
import authRoute from "./routes/authRoute";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/db";
import agentRoute from "./routes/agentRoute";
import nominatimRoute from "./routes/nominatimRoute";
import seedRolesRoute from "./routes/seedRolesRoute";
import shortlistRoutes from "./routes/shortlistRoute";
import roleRoute from "./routes/roleRoute";
import kycRoutes from "./routes/kycRoute";
import userRoutes from "./routes/userRoutes";
import { startNotificationJob } from "./jobs/notification.job";
import emailRouter from "./routes/emailRoute";
import whatsappRouter from "./routes/whatsappRoute";
import builderAccessRoute from "./routes/builderAccessRoute";
import builderProfileRoute from "./routes/builderProfileRoute";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT ?? 4004;

async function start() {
  try {
    await connectDB();
    app.get("/", (req, res) => {
      res.json({ message: "User Service is running" });
    });

    app.use("/api/users/auth", authRoute);
    app.use("/api/users/location", nominatimRoute);
    app.use("/api/users/seeds", seedRolesRoute);
    app.use("/api/users/shortlist", shortlistRoutes);
    app.use("/api/users/builder", builderProfileRoute);
    app.use("/api/users/builder", shortlistRoutes);
    app.use("/api/users/agent", agentRoute);
    app.use("/api/users/roles", roleRoute);
    app.use("/api/users/builder-access", builderAccessRoute);
    app.use("/api/users/kyc", kycRoutes);
    app.use("/api/users/notifications", userRoutes);
    app.use("/api/users/email", emailRouter);
    app.use("/api/users/whatsapp", whatsappRouter);
    

    app.listen(Number(port), "0.0.0.0", () => {
      console.log(`user service running on 0.0.0.0:${port}`);
      // startNotificationJob();
    });
    
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}
start();
