// PM2 process definition for Tencent lightweight cloud (VPS) deployment.
//
// IMPORTANT: run exactly ONE instance (fork mode). Actor sessions live in a
// process-local Map; cluster mode or multiple instances would break identity.
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup   # survive reboot
module.exports = {
  apps: [
    {
      name: "top-modern",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 2000,
      max_memory_restart: "300M",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production"
        // MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASS / MYSQL_DB
        // are read from Modern/.env by dotenv; keep secrets out of this file.
      }
    }
  ]
};
