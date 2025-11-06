module.exports = {
  apps: [
    {
      name: "gateway",
      cwd: "backend/gateway",
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      watch: false,
      time: true
    },
    {
      name: "auth-service",
      cwd: "backend/services/auth-service",
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    },
    {
      name: "payment-service",
      cwd: "backend/services/payment-service",
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    },
    {
      name: "property-service",
      cwd: "backend/services/property-service",
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    },
    {
      name: "user-service",
      cwd: "backend/services/user-service",
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    }
  ]
};
