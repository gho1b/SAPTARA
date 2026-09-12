module.exports = {
  apps: [
    {
      name: "saptara-server",
      cwd: "./server",
      script: "dist/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_PATH: "./saptara.db",
        BETTER_AUTH_SECRET: "saptara-secret-key-change-in-production",
        BETTER_AUTH_URL: "https://d7ad3476-f9f6-433e-8580-bfcd2ac5ba64.svc.dalang.io",
        JWT_SECRET: "saptara-student-jwt-secret-change-in-production",
        UPLOAD_DIR: "./uploads",
      },
      // Restart settings
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/server-error.log",
      out_file: "./logs/server-out.log",
      merge_logs: true,

      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
    {
      name: "saptara-client",
      cwd: "./client",
      script: "node_modules/.bin/vite",
      args: "preview --host 0.0.0.0 --port 4173",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        VITE_API_BASE: "https://d7ad3476-f9f6-433e-8580-bfcd2ac5ba64.svc.dalang.io/api",
      },
      // Restart settings
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/client-error.log",
      out_file: "./logs/client-out.log",
      merge_logs: true,

      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
