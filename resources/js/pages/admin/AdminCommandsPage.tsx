import React from "react";
import { Link } from "react-router-dom";
import { AdminCommandConsole } from "./AdminCommandConsole";
import { Terminal, ArrowLeft, ShieldAlert } from "lucide-react";

export function AdminCommandsPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Zona Khusus Super Admin</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight flex items-center gap-2.5">
            <Terminal className="h-7 w-7 text-amber-400" />
            <span>Konsol Perintah Sistem</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Jalankan command maintenance console (Backup DB, Migrasi Cloudflare R2, Resize Foto 960x1280, Laporan Mingguan, dan Sinkronisasi Streak) secara manual jika cron scheduler di hosting mengalami kendala.
          </p>
        </div>
      </div>

      {/* Main Console Component */}
      <AdminCommandConsole />
    </div>
  );
}
