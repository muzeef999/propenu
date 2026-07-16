import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

import app from "./app";

const PORT = process.env.PORT ?? 4006;

process.on("uncaughtException", (error) => {
  console.error("AI service uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("AI service unhandled rejection:", reason);
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`AI SERVICE RUNNING on 0.0.0.0:${PORT}`);
});
