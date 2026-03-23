module.exports = {
  apps: [
    {
      name: "gateway",
      cwd: __dirname + "/gateway",
      script: "dist/server.js",
      instances: "max",
      exec_mode: "cluster",
    },

    {
      name: "user-service",
      cwd: __dirname + "/services/user-service",
      script: "dist/services/user-service/src/server.js",
      instances: 1,
      exec_mode: "fork",
    },

    {
      name: "property-service",
      cwd: __dirname + "/services/property-service",
      script: "dist/services/property-service/src/server.js",
      instances: 1,
      exec_mode: "fork",
    },

    {
      name: "payment-service",
      cwd: __dirname + "/services/payment-service",
      script: "dist/services/payment-service/src/server.js",
      instances: 1,
      exec_mode: "fork",
    },
  ],
};