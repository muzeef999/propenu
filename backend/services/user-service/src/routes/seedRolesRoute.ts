import express from "express";
import Role from "../models/roleModel";

const router = express.Router();

router.post("/seed-roles", async (_req, res) => {
  try {
    // 1️⃣ Define all permissions in one place
    const ALL_PERMISSIONS = [
      "project:create",
      "project:view",
      "project:edit",
      "project:delete",
      "project:transfer",

      "lead:create",
      "lead:view",
      "lead:edit",
      "lead:delete",
      "lead:assign",

      "agent:create",
      "agent:view",
      "agent:edit",
      "agent:delete"
    ];

    // 2️⃣ Define roles
    const roles = [
      {
        name: "super_admin",
        label: "Super Admin",
        permissions: ALL_PERMISSIONS, // all permissions
      },
      {
        name: "admin",
        label: "Admin",
        permissions: [
          "project:create",
          "project:view",
          "project:edit",
          "project:delete",
          "lead:create",
          "lead:view",
          "lead:edit",
          "lead:delete",
          "lead:assign",
          "agent:view",
          "agent:edit",
        ],
      },
      {
        name: "sales_manager",
        label: "Sales Manager",
        permissions: [
          "project:view",
          "project:edit",
          "project:create",
          "lead:view",
          "lead:assign",
        ],
      },
      {
        name: "sales_agent",
        label: "Sales Agent",
        permissions: [
          "project:view",
          "lead:view",
          "lead:edit",
        ],
      },
      {
        name: "user",
        label: "User",
        permissions: [
          "project:view",
          "project:create",
        ],
      },
       {
    name: "agent",
    label: "Agent",
    permissions: [
      "project:view",
      "lead:view",
      "lead:edit",
      "agent:view"
    ],
  },
    ];

    // 3️⃣ Upsert roles (create if not exist, update if exist)
    for (const role of roles) {
      await Role.findOneAndUpdate({ name: role.name }, role, { upsert: true });
    }

    res.json({ message: "Roles seeded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to seed roles" });
  }
});

export default router;
