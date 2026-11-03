import React, { useState, useEffect, useRef } from "react";
import {
  adminService,
  type CommandExecutionStatus,
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
  Clock,
  History,
  Activity,
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
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<CommandExecutionStatus | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [optionsState, setOptionsState] = useState<Record<string, { dryRun?: boolean; recalculate?: boolean }>>({
    migrate_r2: { dryRun: false },
    optimize_photos: { dryRun: false },
    sync_streaks: { recalculate: false },
  });
  const [history, setHistory] = useState<CommandExecutionStatus[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const terminalRef = useRef<HTMLPreElement | null>(null);

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await adminService.getCommandHistory();
      setHistory(data);
    } catch {
      // Ignore background history error
    } finally {
      setLoadingHistory(false);
    }
  };

  // Polling loop when task is running
  useEffect(() => {
    if (!activeExecutionId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const statusData = await adminService.getCommandStatus(activeExecutionId);
        if (!isMounted) return;

        setActiveTask(statusData);

        // Auto-scroll terminal to bottom
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }

        // When task reaches terminal state
        if (statusData.status === "completed" || statusData.status === "failed") {
          setActiveExecutionId(null);
          loadHistory();

          const isSuccess = statusData.status === "completed";
          const msg = isSuccess
            ? `✅ Command '${statusData.title}' selesai dengan sukses (${statusData.duration_seconds ?? 0}s)!`
            : `❌ Command '${statusData.title}' gagal (Exit Code: ${statusData.exit_code})!`;

          setNotificationBanner({
            type: isSuccess ? "success" : "error",
            message: msg,
          });

          // Trigger browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("SAPTARA Super Admin Console", {
                body: msg,
                icon: "/favicon.ico",
              });
            } catch {
              // Ignore notification failure
            }
          }
        }
      } catch (err: any) {
        console.error("Gagal memeriksa status task:", err);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeExecutionId]);

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

    const confirmMsg =
      `Luncurkan command '${cmd.title}' (${cmd.signature}) di background?\n\n` +
      `Command akan dijalankan secara independen di latar belakang server tanpa terputus timeout Cloudflare. ` +
      `Audit Log::warning akan otomatis dicatat di server.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setStartingKey(cmd.key);
    setErrorMsg(null);
    setNotificationBanner(null);

    try {
      const res = await adminService.runCommand(cmd.key, {
        dry_run: isDryRun,
        recalculate: isRecalc,
      });

      if (res.success && res.execution_id) {
        setActiveExecutionId(res.execution_id);
        setActiveTask({
          id: res.execution_id,
          command: res.command,
          title: res.title,
          status: "running",
          exit_code: null,
          output: "Proses diluncurkan di background... Membaca stream log...\n",
          started_at: new Date().toISOString(),
          finished_at: null,
          duration_seconds: 0,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal meluncurkan command console di background");
    } finally {
      setStartingKey(null);
    }
  };

  const handleCopyOutput = () => {
    if (!activeTask?.output) return;
    navigator.clipboard.writeText(activeTask.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const viewHistoryItem = async (item: CommandExecutionStatus) => {
    try {
      const full = await adminService.getCommandStatus(item.id);
      setActiveTask(full);
      // If still running, resume polling
      if (full.status === "running" || full.status === "queued") {
        setActiveExecutionId(full.id);
      }
    } catch {
      setActiveTask(item);
    }
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
                Jalankan perintah sistem di latar belakang (asynchronous) bebas dari batasan Cloudflare Timeout 120s.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeExecutionId ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-300 text-sky-800 text-xs font-bold animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 text-sky-600 animate-spin" />
                <span>Background Task Sedang Berjalan</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Audit: Memicu Log::warning</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Completion Toast Notification */}
        {notificationBanner && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-sm ${
              notificationBanner.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notificationBanner.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold text-sm">{notificationBanner.message}</span>
            </div>
            <button
              onClick={() => setNotificationBanner(null)}
              className="p-1 rounded-lg hover:bg-black/5 text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Banner Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
          <Activity className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800 font-semibold block">Asynchronous Background Runner:</strong>
            Perintah dijalankan langsung sebagai proses CLI mandiri di server. Respons web selesai dalam milidetik sehingga aman dari pemutusan Cloudflare Timeout (Error 524). Anda dapat menutup atau berpindah halaman; proses akan tetap berjalan hingga selesai di server.
          </div>
        </div>

        {/* Grid Commands */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {COMMAND_CONFIGS.map((cmd) => {
            const isStarting = startingKey === cmd.key;
            const isThisTaskActive = activeTask?.command === cmd.signature && (activeTask.status === "running" || activeTask.status === "queued");
            const currentOpts = optionsState[cmd.key] || {};

            return (
              <div
                key={cmd.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white shadow-2xs ${
                  isThisTaskActive
                    ? "border-sky-400 ring-2 ring-sky-100 bg-sky-50/20"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
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
                    disabled={isStarting || activeExecutionId !== null}
                    onClick={() => handleRun(cmd)}
                    className={`w-full gap-1.5 font-semibold text-xs shadow-xs transition-colors ${
                      isThisTaskActive
                        ? "bg-sky-600 hover:bg-sky-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isStarting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Meluncurkan...</span>
                      </>
                    ) : isThisTaskActive ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Sedang Berjalan di Background</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Jalankan di Background</span>
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
              <strong className="block font-semibold">Gagal Meluncurkan Command:</strong>
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

        {/* Live Terminal Output Box */}
        {activeTask && (
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 shadow-xl text-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                {activeTask.status === "running" || activeTask.status === "queued" ? (
                  <RefreshCw className="h-4 w-4 text-sky-400 animate-spin" />
                ) : activeTask.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}

                <span className="font-bold text-sm text-white">
                  {activeTask.title} ({activeTask.command})
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTask.status === "running" || activeTask.status === "queued"
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      : activeTask.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {activeTask.status.toUpperCase()}
                  {activeTask.exit_code !== null ? ` (Exit Code: ${activeTask.exit_code})` : ""}
                </span>

                {activeTask.duration_seconds !== null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{activeTask.duration_seconds}s</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
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
                      <span>Salin Log</span>
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setActiveTask(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                  title="Tutup Output"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <pre
              ref={terminalRef}
              className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96 leading-relaxed select-all"
            >
              {activeTask.output || "(Menunggu stream keluaran terminal...)"}
            </pre>
          </div>
        )}

        {/* History Table */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Riwayat Eksekusi Terakhir
              </h4>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="h-7 text-xs gap-1 text-slate-600 border-slate-200"
            >
              <RefreshCw className={`h-3 w-3 ${loadingHistory ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </Button>
          </div>

          {history.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada riwayat eksekusi command background.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Perintah</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Durasi</th>
                    <th className="px-3.5 py-2.5">Waktu Mulai</th>
                    <th className="px-3.5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5 font-medium text-slate-900">
                        <div className="font-semibold">{item.title}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.command}</div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            item.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "running"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">
                        {item.duration_seconds !== null ? `${item.duration_seconds}s` : "-"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                        {item.started_at ? new Date(item.started_at).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewHistoryItem(item)}
                          className="h-6 text-[11px] px-2 border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          Lihat Log
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
