module.exports = {
  apps: [
    { name: 'gateway',
      cwd: __dirname + '/gateway',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster'
    },
    { name: 'user-service',
      cwd: __dirname + '/services/user-service',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster'
    },
    { name: 'property-service',
      cwd: __dirname + '/services/property-service',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster'
    },
    { name: 'payment-service',
      cwd: __dirname + '/services/payment-service',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster'
    }
  ]
};
