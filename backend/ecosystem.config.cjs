module.exports = {
  apps: [
    { name: 'gateway',
      cwd: __dirname + '/gateway',
      script: 'dist/server.js',
      instances: 'max',
      instances: 1,
      exec_mode: 'cluster'
    },
    { name: 'user-service',
      cwd: __dirname + '/services/user-service',
      script: "dist/services/user-service/src/server.js",
            // dist/services/user-service/src/server.js
      instances: 1,
      exec_mode: 'cluster'
    },
    {
      name: "email-worker",
      script:
        "backend/services/user-service/dist/services/user-service/src/workers/email.worker.js",
    },
    { name: 'property-service',
      cwd: __dirname + '/services/property-service',
      script: "dist/services/property-service/src/server.js",
      instances: 1,
      exec_mode: 'cluster'
    },
    { name: 'payment-service',
      cwd: __dirname + '/services/payment-service',
      script: 'dist/backend/services/payment-service/src/server.js',
      instances: 1,
      exec_mode: 'cluster'
    }
  ]
};
