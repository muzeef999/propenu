import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import { Plan } from "../models/planModel";
import { plans } from "./plansData";

dotenv.config();

async function seedPlans() {
  try {

    await connectDB();

    // 🚨 STEP 1: DELETE ALL OLD DATA
    await Plan.deleteMany({});
   
    // 🌱 STEP 2: INSERT NEW DATA
    await Plan.insertMany(plans);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedPlans();
