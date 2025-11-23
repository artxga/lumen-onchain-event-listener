module.exports = {
  apps: [
    {
      name: "lumen-listener",
      script: "dist/index.js",
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
