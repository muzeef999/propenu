module.exports = {
  apps: [
    {
      name: "gateway",
      cwd: "backend/gateway",
      script: 'dist/server.js',
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      watch: false,
      time: true
    },    
    {
      name: "payment-service",
      cwd: "backend/services/payment-service",
      script: 'dist/server.js',
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    },
    {
      name: "property-service",
      cwd: "backend/services/property-service",
      script: 'dist/server.js',
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    },
    {
      name: "user-service",
      cwd: "backend/services/user-service",
      script: 'dist/server.js',
      args: "start",
      env: { NODE_ENV: "production" },
      instances: 1, autorestart: true, watch: false, time: true
    }
  ]
};
