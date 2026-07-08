import app from "./app";
import { connectDB } from "../config/db";

const PORT = process.env.PORT ?? 4007;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log("====================================");
      console.log(`🚀 Ticket Service Running`);
      console.log("====================================");
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();
