import express from "express";
import dotenv from "dotenv";

dotenv.config({ quiet: true });


const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 4002;

async function start() {
  try {


    app.get("/", (req, res) => {
      res.json({ message: "Payment Service is running" });
    });




    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`payment Service running on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}
start();
