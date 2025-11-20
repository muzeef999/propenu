export const roles = [
  {
    name: "super_admin",
    displayName: "Super Admin",
    scope: "global",
    permissions: { "*": ["*"] },
  },
  {
    name: "builder",
    displayName: "Builder",
    scope: "builder",
    permissions: {
      project: ["create", "update", "view"],
      lead: ["view", "export"],
    },
  },
  {
    name: "agent",
    displayName: "Agent",
    scope: "builder",
    permissions: { lead: ["view", "update"], project: ["view"] },
  },
  {
    name: "admin",
    displayName: "Builder Admin",
    scope: "builder",
    permissions: {
      user: ["view", "create", "update"],
      lead: ["*"],
      settings: ["view", "update"],
    },
  },
  {
    name: "sales_manager",
    displayName: "Sales Manager",
    scope: "builder",
    permissions: {
      lead: ["view", "assign", "transfer", "update"],
      report: ["view"],
    },
  },
  {
    name: "sales_agent",
    displayName: "Sales Agent",
    scope: "builder",
    permissions: { lead: ["view", "update"] },
  },
  {
    name: "viewer",
    displayName: "Viewer",
    scope: "builder",
    permissions: { lead: ["view"], project: ["view"] },
  },
];
