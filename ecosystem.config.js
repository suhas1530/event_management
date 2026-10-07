// ecosystem.config.js — PM2 process definitions for avān.
//
// Start:   pm2 start ecosystem.config.js
// Reload:  pm2 reload ecosystem.config.js   (zero downtime)
// Logs:    pm2 logs
// Boot:    pm2 startup && pm2 save
//
// See README.PM2.md step 8 for the reasoning behind each setting.

module.exports = {
  apps: [
    {
      // ─── Express API ────────────────────────────────────────────────────
      name: 'avan-api',
      cwd: './backend',
      script: 'dist/index.js',
      exec_mode: 'cluster',
      instances: 2,

      // backend/src/config/index.ts calls dotenv.config(), which reads
      // backend/.env automatically. Values here are process-level overrides.
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
      },

      autorestart: true,
      // backend/src/index.ts traps SIGTERM, drains the HTTP server, then
      // disconnects Prisma, with a 10s forced-exit fallback. PM2's default
      // kill_timeout of 1600ms would SIGKILL mid-shutdown and leak connections.
      kill_timeout: 12000,
      max_memory_restart: '400M',
      max_restarts: 10,
      min_uptime: '20s',
      restart_delay: 2000,

      out_file: './logs/api.out.log',
      error_file: './logs/api.err.log',
      merge_logs: true,
      time: true,
    },

    {
      // ─── Next.js frontend ───────────────────────────────────────────────
      name: 'avan-web',
      cwd: './',
      script: 'node_modules/.bin/next',
      args: 'start --hostname 0.0.0.0 --port 3000',
      exec_mode: 'cluster',
      // Safe here: every page under app/ is a 'use client' component that
      // fetches from the API — no ISR, no server-side data cache, and no
      // Server Actions, so there is no cross-instance state to coordinate.
      // Set to 1 on a 1 GB VPS.
      instances: 2,

      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },

      autorestart: true,
      kill_timeout: 12000,
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '20s',
      restart_delay: 2000,

      // Do NOT enable watch — it restarts the app on every write to .next/,
      // including during `next build`.
      out_file: './logs/web.out.log',
      error_file: './logs/web.err.log',
      merge_logs: true,
      time: true,
    },
  ],
}