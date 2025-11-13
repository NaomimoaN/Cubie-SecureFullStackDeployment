// PM2 Ecosystem Configuration File
// This file configures PM2 to manage Node.js application instances
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "cubie-api-server",
      script: "./server.js",
      cwd: ".",
      instances: 2, // Run 2 instances for load balancing
      exec_mode: "cluster", // Use cluster mode for better performance
      env: {
        NODE_ENV: "production",
        PORT: 5001,
      },
      // Logging configuration
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true, // Prepend timestamp to logs
      merge_logs: true, // Merge logs from all instances

      // Auto-restart configuration
      autorestart: true,
      watch: false, // Disable watch in production
      max_memory_restart: "1G", // Restart if memory exceeds 1GB

      // Graceful shutdown
      kill_timeout: 5000, // Wait 5 seconds before force kill
      wait_ready: true, // Wait for app to be ready
      listen_timeout: 10000, // Wait 10 seconds for app to start

      // Advanced options
      min_uptime: "10s", // Consider app stable after 10 seconds
      max_restarts: 10, // Max restarts in 1 minute
      restart_delay: 4000, // Wait 4 seconds before restart
    },
  ],
};
