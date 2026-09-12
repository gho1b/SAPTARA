import fs from "fs";
import path from "path";
import { getWIBDateTime } from "./timezone.js";

/**
 * Simple file-based logger for SAPTARA server.
 *
 * Writes error logs to `logs/error.log` and combined logs to `logs/combined.log`.
 * Each log entry includes WIB timestamp, level, message, and optional metadata.
 */

const LOG_DIR = path.resolve(process.env.LOG_DIR || "./logs");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const ERROR_LOG = path.join(LOG_DIR, "error.log");
const COMBINED_LOG = path.join(LOG_DIR, "combined.log");

type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  method?: string;
  url?: string;
  statusCode?: number;
  stack?: string;
  meta?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level}]`,
    entry.message,
  ];

  if (entry.method && entry.url) {
    parts.push(`| ${entry.method} ${entry.url}`);
  }
  if (entry.statusCode) {
    parts.push(`| status=${entry.statusCode}`);
  }
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    parts.push(`| meta=${JSON.stringify(entry.meta)}`);
  }
  if (entry.stack) {
    parts.push(`\n  Stack: ${entry.stack}`);
  }

  return parts.join(" ") + "\n";
}

function writeLog(filePath: string, content: string) {
  try {
    fs.appendFileSync(filePath, content, "utf-8");
  } catch {
    // Fallback: if file write fails, at least console it
    console.error(`[Logger] Failed to write to ${filePath}`);
  }
}

function getTimestamp(): string {
  const { date, time } = getWIBDateTime();
  return `${date} ${time} WIB`;
}

/**
 * Rotate log file if it exceeds maxSize (default 5MB).
 */
function rotateIfNeeded(filePath: string, maxSize = 5 * 1024 * 1024) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size >= maxSize) {
        const { date, time } = getWIBDateTime();
        const rotatedName = `${filePath}.${date}_${time.replace(":", "")}.bak`;
        fs.renameSync(filePath, rotatedName);
      }
    }
  } catch {
    // Silently ignore rotation errors
  }
}

export const logger = {
  /**
   * Log informational message (combined.log only).
   */
  info(message: string, meta?: Record<string, unknown>) {
    const entry = formatEntry({
      timestamp: getTimestamp(),
      level: "INFO",
      message,
      meta,
    });
    console.log(`ℹ️  ${message}`);
    rotateIfNeeded(COMBINED_LOG);
    writeLog(COMBINED_LOG, entry);
  },

  /**
   * Log warning (combined.log only).
   */
  warn(message: string, meta?: Record<string, unknown>) {
    const entry = formatEntry({
      timestamp: getTimestamp(),
      level: "WARN",
      message,
      meta,
    });
    console.warn(`⚠️  ${message}`);
    rotateIfNeeded(COMBINED_LOG);
    writeLog(COMBINED_LOG, entry);
  },

  /**
   * Log error (both error.log and combined.log).
   */
  error(
    message: string,
    options?: {
      error?: Error;
      method?: string;
      url?: string;
      statusCode?: number;
      meta?: Record<string, unknown>;
    }
  ) {
    const entry = formatEntry({
      timestamp: getTimestamp(),
      level: "ERROR",
      message,
      method: options?.method,
      url: options?.url,
      statusCode: options?.statusCode,
      stack: options?.error?.stack,
      meta: options?.meta,
    });

    console.error(`❌ ${message}`);
    if (options?.error?.stack) {
      console.error(options.error.stack);
    }

    rotateIfNeeded(ERROR_LOG);
    rotateIfNeeded(COMBINED_LOG);
    writeLog(ERROR_LOG, entry);
    writeLog(COMBINED_LOG, entry);
  },

  /**
   * Log fatal/crash-level error (both logs + stderr).
   */
  fatal(message: string, error?: Error) {
    const entry = formatEntry({
      timestamp: getTimestamp(),
      level: "FATAL",
      message,
      stack: error?.stack,
    });

    console.error(`🔥 FATAL: ${message}`);
    if (error?.stack) console.error(error.stack);

    rotateIfNeeded(ERROR_LOG);
    rotateIfNeeded(COMBINED_LOG);
    writeLog(ERROR_LOG, entry);
    writeLog(COMBINED_LOG, entry);
  },
};
