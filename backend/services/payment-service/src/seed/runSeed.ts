import mongoose from "mongoose";
import { Plan } from "../models/planModel";
import { plans } from "./plansSeed";


async function runSeed() {
  await mongoose.connect(process.env.MONGO_URI!);

  for (const plan of plans) {
    await Plan.updateOne(
      { code: plan.code },
      { $set: plan },
      { upsert: true }
    );
  }

  console.log("✅ Plans seeded successfully");
  process.exit();
}

runSeed();
