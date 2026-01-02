import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Plan } from "../models/planModel";
import { plans } from "./plansData";
import { connectDB } from "../config/db";

async function seedPlans() {
  try {
   
    await connectDB();

    for (const plan of plans) {
      await Plan.updateOne(
        { code: plan.code },   // unique key
        { $set: plan },        // update data
        { upsert: true }       // insert if not exists
      );
    }

    console.log("✅ Plans seeded successfully");
  } catch (error) {
    console.error("❌ Seeding failed", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedPlans();
