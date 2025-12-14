import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import featurePropertiesRoute from "./routes/featurePropertiesRoute";
import popularOwnerPropertiesRoute from "./routes/popularOwnerPropertiesRoute";
import highlightProjectsRoute from "./routes/highlightProjectsRoute";
import residentialRoutes from "./routes/residentialRoute";
import commercialRoutes from "./routes/commercialRoute";
import landRoutes from "./routes/landRoute";
import agriculturalRoutes from "./routes/agriculturalRoute";
import searchRoute from "./routes/searchRoute";
import leadRoute from "./routes/leadRoute";

dotenv.config({ quiet: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT ?? 4003;

async function start() {
  try {
    await connectDB();
    app.get("/", (req, res) => {
      res.json({ message: "Property Service is running" });
    });

    app.use("/api/properties/featured-project", featurePropertiesRoute);
    app.use("/api/properties/owners-properties", popularOwnerPropertiesRoute);
    app.use("/api/properties/highlight-projects", highlightProjectsRoute);
    app.use("/api/properties/residential", residentialRoutes);
    app.use("/api/properties/commercial", commercialRoutes);
    app.use("/api/properties/land", landRoutes);
    app.use("/api/properties/agricultural", agriculturalRoutes);
    app.use("/api/properties/search", searchRoute);
    app.use('/api/properties', searchRoute);
    app.use('/api/properties/leads', leadRoute);

    app.listen(Number(port), "0.0.0.0", () => {
      console.log(`proportey running on 0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
