import mongoose from "mongoose";
const { Schema } = mongoose;

const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true }, // 'sales_agent', 'admin'
  displayName: { type: String }, // 'Sales Agent'
  description: { type: String },
  permissions: { type: Schema.Types.Mixed, default: {} },
  scope: { type: String, enum: ["global", "builder"], default: "builder" },
  createdAt: { type: Date, default: Date.now },
});

const Role = mongoose.model("Role", RoleSchema);
export default Role;
