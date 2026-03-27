/** PM2: run from repo root — `pm2 start ecosystem.config.cjs` */
module.exports = {
  apps: [
    {
      name: "smplace-api",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
