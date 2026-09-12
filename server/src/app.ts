import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // ── CORS ──
  app.use(
    cors({
      origin: [
        "http://localhost:8080",  // Frontend (PowerShell serve)
        "http://localhost:5173",  // Frontend (Vite dev server)
        "http://localhost:5500",  // Live Server
        "http://localhost:3000",  // Same origin
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        // Production: Dalang public domain (same origin via nginx, but just in case)
        "https://d7ad3476-f9f6-433e-8580-bfcd2ac5ba64.svc.dalang.io",
        ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // ── Body Parsers ──
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Static file serving for uploads ──
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  app.use("/uploads", express.static(path.resolve(uploadDir)));

  // ── Root route ──
  app.get("/", (_req, res) => {
    res.json({
      name: "SAPTARA — Sapta Karakter Anak Nusantara",
      description: "Ekspedisi Tujuh Samudra — Backend API",
      version: "1.0.0",
      status: "ok",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth",
        classes: "/api/classes",
        students: "/api/students",
        habits: "/api/habits",
        logbook: "/api/logbook",
        rewards: "/api/rewards",
      },
      frontend: "http://localhost:8080",
      timestamp: new Date().toISOString(),
    });
  });

  // ── Health check ──
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      name: "SAPTARA API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // ── All API routes ──
  app.use(routes);

  // ── Global error handler (must be last) ──
  app.use(errorHandler);

  return app;
}
