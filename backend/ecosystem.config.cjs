// backend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'gateway',
      cwd: __dirname + '/gateway',     // <-- we're already inside backend/
      script: 'dist/server.js',        // <-- NOT backend/gateway/...
      instances: 'max',
      exec_mode: 'cluster'
    },
    {
      name: 'user-service',
      cwd: __dirname + '/services/user-service',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster'
    },
    {
      name: 'property-service',
      cwd: __dirname + '/services/property-service',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster'
    },
    {
      name: 'payment-service',
      cwd: __dirname + '/services/payment-service',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster'
    }
  ]
}
