import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT ?? 4006;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🌍 AI SERVICE RUNNING on 0.0.0.0:${PORT}`);
});
