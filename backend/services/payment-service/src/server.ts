import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ?? 4002;

const app = express();

app.use(express.json({limit: '1mb'}));

app.use("/payments", paymentsRouter);

app.use("/webhooks/razorpay",  express.raw({ type: "application/json" }), webhooksRouter);


app.get("/", (req, res) => {
  res.json({ message: "Payment Service is running" });
});

app.listen(PORT, () => {
  console.log(`Payment service is running on port ${PORT}`);
});