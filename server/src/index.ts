import "dotenv/config";
import { createApp } from "./app.js";
import fs from "fs";
import path from "path";
import { logger } from "./utils/logger.js";

// ── Diagnostic: catch ALL reasons the process might exit ──
process.on("SIGTERM", () => {
  logger.warn("Received SIGTERM — container/systemd is stopping the process");
  process.exit(0);
});
process.on("SIGINT", () => {
  logger.warn("Received SIGINT — interrupted (Ctrl+C)");
  process.exit(0);
});
process.on("SIGHUP", () => {
  logger.warn("Received SIGHUP — terminal hangup");
});
process.on("uncaughtException", (err) => {
  logger.fatal("Uncaught Exception", err);
});
process.on("unhandledRejection", (reason) => {
  logger.fatal(
    "Unhandled Rejection",
    reason instanceof Error ? reason : new Error(String(reason))
  );
});
process.on("beforeExit", (code) => {
  logger.warn(`beforeExit event — code: ${code} (event loop is empty)`);
});
process.on("exit", (code) => {
  logger.info(`Process exiting with code: ${code}`);
});

const PORT = parseInt(process.env.PORT || "3000", 10);

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${path.resolve(uploadDir)}`);
}

const app = createApp();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("  ⛵ ═══════════════════════════════════════");
  console.log("  ⛵  SAPTARA — Sapta Karakter Anak Nusantara");
  console.log("  ⛵  Ekspedisi Tujuh Samudra — Backend API");
  console.log("  ⛵ ═══════════════════════════════════════");
  console.log("");
  console.log(`  🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`  📋 Health check:     http://localhost:${PORT}/api/health`);
  console.log(`  🔐 Auth (Better):    http://localhost:${PORT}/api/auth`);
  console.log(`  🏫 Classes API:      http://localhost:${PORT}/api/classes`);
  console.log(`  🧒 Students API:     http://localhost:${PORT}/api/students`);
  console.log(`  📋 Habits API:       http://localhost:${PORT}/api/habits`);
  console.log(`  📸 Logbook API:      http://localhost:${PORT}/api/logbook`);
  console.log(`  🏅 Rewards API:      http://localhost:${PORT}/api/rewards`);
  console.log("");
});

// Keep-alive: prevent event loop from being considered "empty"
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
