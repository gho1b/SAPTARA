import React, { useState } from "react";
import {
  adminService,
  type SystemCommandMeta,
  type CommandExecutionResult,
} from "../../services/admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Terminal,
  Play,
  Database,
  Cloud,
  FileImage,
  Mail,
  Flame,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  X,
} from "lucide-react";

interface CommandConfig {
  key: string;
  signature: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  hasDryRun?: boolean;
  hasRecalculate?: boolean;
}

const COMMAND_CONFIGS: CommandConfig[] = [
  {
    key: "backup_db",
    signature: "db:backup",
    title: "Backup Basis Data",
    description: "Melakukan full dump database MySQL ke file .sql.gz dengan retensi rotasi 7 hari.",
    icon: <Database className="h-5 w-5 text-emerald-500" />,
    badge: "Database",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    key: "migrate_r2",
    signature: "logbook:migrate-to-r2",
    title: "Migrasi Foto ke Cloudflare R2",
    description: "Stream foto logbook lama 1-by-1 ke R2 dan langsung hapus lokal untuk bebaskan storage hosting.",
    icon: <Cloud className="h-5 w-5 text-sky-500" />,
    badge: "R2 Storage",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    hasDryRun: true,
  },
  {
    key: "optimize_photos",
    signature: "logbook:optimize-photos",
    title: "Optimasi Foto Logbook Lama",
    description: "Crop & kompres foto logbook ke standar 960x1280 JPEG dan langsung menimpa file lama (in-place).",
    icon: <FileImage className="h-5 w-5 text-amber-500" />,
    badge: "Image Processing",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    hasDryRun: true,
  },
  {
    key: "send_weekly_reports",
    signature: "saptara:send-weekly-reports",
    title: "Kirim Laporan Mingguan",
    description: "Kirim rekap mingguan pembiasaan karakter ke alamat email orang tua siswa.",
    icon: <Mail className="h-5 w-5 text-indigo-500" />,
    badge: "Email Notifikasi",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    key: "sync_streaks",
    signature: "saptara:sync-streaks",
    title: "Sinkronisasi Streak Siswa",
    description: "Sinkronisasi streak harian siswa dan reset streak yang kedaluwarsa.",
    icon: <Flame className="h-5 w-5 text-rose-500" />,
    badge: "Gamifikasi",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    hasRecalculate: true,
  },
];

export function AdminCommandConsole() {
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [optionsState, setOptionsState] = useState<Record<string, { dryRun?: boolean; recalculate?: boolean }>>({
    migrate_r2: { dryRun: false },
    optimize_photos: { dryRun: false },
    sync_streaks: { recalculate: false },
  });
  const [result, setResult] = useState<CommandExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleOption = (commandKey: string, optKey: "dryRun" | "recalculate") => {
    setOptionsState((prev) => ({
      ...prev,
      [commandKey]: {
        ...prev[commandKey],
        [optKey]: !prev[commandKey]?.[optKey],
      },
    }));
  };

  const handleRun = async (cmd: CommandConfig) => {
    const isDryRun = optionsState[cmd.key]?.dryRun;
    const isRecalc = optionsState[cmd.key]?.recalculate;

    const confirmMsg = `Jalankan command '${cmd.title}' (${cmd.signature}) secara manual?` +
      `\n\nCatatan: Tindakan ini akan memicu Log::warning pada server untuk keperluan audit.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setRunningKey(cmd.key);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await adminService.runCommand(cmd.key, {
        dry_run: isDryRun,
        recalculate: isRecalc,
      });
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menjalankan command console");
    } finally {
      setRunningKey(null);
    }
  };

  const handleCopyOutput = () => {
    if (!result?.output) return;
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-white border-slate-200/80 shadow-xs">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-display font-bold text-slate-900">
                Konsol Operasional & Pemeliharaan Manual (Super Admin)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Jalankan perintah sistem dan cron job secara manual saat cron scheduler hosting tidak berjalan.
              </CardDescription>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Audit: Memicu Log::warning</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Banner Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold block">Catatan Keamanan & Audit:</strong>
            Setiap eksekusi manual dari tombol di bawah akan otomatis mencatat riwayat ke log server (<code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">Log::warning</code>) dengan identitas Super Admin, IP address, dan timestamp untuk penanda bahwa proses dijalankan di luar jadwal otomatis.
          </div>
        </div>

        {/* Grid Commands */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {COMMAND_CONFIGS.map((cmd) => {
            const isRunning = runningKey === cmd.key;
            const currentOpts = optionsState[cmd.key] || {};

            return (
              <div
                key={cmd.key}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between bg-white shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      {cmd.icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cmd.badgeColor}`}>
                      {cmd.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-display font-bold text-slate-900 leading-snug">
                      {cmd.title}
                    </h4>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                      {cmd.signature}
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {cmd.description}
                    </p>
                  </div>

                  {/* Options */}
                  {(cmd.hasDryRun || cmd.hasRecalculate) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                      {cmd.hasDryRun && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                          <input
                            type="checkbox"
                            checked={!!currentOpts.dryRun}
                            onChange={() => toggleOption(cmd.key, "dryRun")}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] font-medium">Dry Run (Simulasi)</span>
                        </label>
                      )}

                      {cmd.hasRecalculate && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                          <input
                            type="checkbox"
                            checked={!!currentOpts.recalculate}
                            onChange={() => toggleOption(cmd.key, "recalculate")}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] font-medium">Hitung Ulang Semua</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    disabled={runningKey !== null}
                    onClick={() => handleRun(cmd)}
                    className="w-full gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Mengeksekusi...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Eksekusi Manual</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Gagal Mengeksekusi Command:</strong>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Output Modal / Terminal Result Box */}
        {result && (
          <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4 shadow-xl text-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}
                <span className="font-bold text-sm text-white">
                  {result.title} ({result.command})
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    result.success
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  Exit Code: {result.exit_code}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {result.executed_at}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyOutput}
                  className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300 gap-1 px-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin Output</span>
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setResult(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                  title="Tutup Output"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <pre className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-80 leading-relaxed select-all">
              {result.output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
