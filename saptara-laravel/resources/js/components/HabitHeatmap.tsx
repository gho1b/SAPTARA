import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { Calendar, CheckCircle2, Camera } from "lucide-react";

interface HeatmapDay {
  date: string;
  completions: number;
  verifiedLogs: number;
  level: number; // 0 to 4
}

interface HeatmapResponse {
  studentId: number;
  startDate: string;
  endDate: string;
  days: Record<string, HeatmapDay>;
}

interface HabitHeatmapProps {
  studentId: number;
  studentName?: string;
}

export function HabitHeatmap({ studentId, studentName }: HabitHeatmapProps) {
  const { data, isLoading } = useQuery<HeatmapResponse>({
    queryKey: ["student-heatmap", studentId],
    queryFn: () => apiClient.get<HeatmapResponse>(`/students/${studentId}/heatmap`),
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-24 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  const daysObj = data?.days ?? {};
  const dayKeys = Object.keys(daysObj).sort();

  // Group days into weeks of 7 days
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  dayKeys.forEach((key, idx) => {
    currentWeek.push(daysObj[key]);
    if (currentWeek.length === 7 || idx === dayKeys.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getLevelClass = (level: number) => {
    switch (level) {
      case 1:
        return "bg-sky-200 border-sky-300 text-sky-900";
      case 2:
        return "bg-sky-400 border-sky-500 text-white";
      case 3:
        return "bg-sky-600 border-sky-700 text-white";
      case 4:
        return "bg-emerald-500 border-emerald-600 text-white shadow-xs";
      default:
        return "bg-slate-100 border-slate-200 text-slate-400";
    }
  };

  // Calculate totals
  let totalCompletions = 0;
  let totalLogs = 0;
  let activeDays = 0;

  dayKeys.forEach((key) => {
    const day = daysObj[key];
    totalCompletions += day.completions;
    totalLogs += day.verifiedLogs;
    if (day.completions > 0) activeDays++;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sky-600" />
          <h3 className="font-bold text-sm text-slate-900">
            Jejak Pelayaran 60 Hari Terakhir {studentName ? `— ${studentName}` : ""}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
            {activeDays} Hari Aktif
          </span>
          <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Camera className="h-3.5 w-3.5 text-emerald-600" />
            {totalLogs} Foto Terverifikasi
          </span>
        </div>
      </div>

      {/* Grid Heatmap */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 min-w-full">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const dateObj = new Date(day.date);
                const dateFormatted = dateObj.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const tooltipText = `${dateFormatted}: ${day.completions}/7 kebiasaan (${day.verifiedLogs} foto verifikasi)`;

                return (
                  <div
                    key={day.date}
                    title={tooltipText}
                    className={`h-4 w-4 sm:h-5 sm:w-5 rounded-md border transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer ${getLevelClass(
                      day.level
                    )}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <span>60 Hari Lalu</span>
        <div className="flex items-center gap-1.5">
          <span>Kurang</span>
          <div className="h-3 w-3 rounded-xs border border-slate-200 bg-slate-100" />
          <div className="h-3 w-3 rounded-xs border border-sky-300 bg-sky-200" />
          <div className="h-3 w-3 rounded-xs border border-sky-500 bg-sky-400" />
          <div className="h-3 w-3 rounded-xs border border-sky-700 bg-sky-600" />
          <div className="h-3 w-3 rounded-xs border border-emerald-600 bg-emerald-500" />
          <span>7 Kebiasaan Penuh</span>
        </div>
        <span>Hari Ini</span>
      </div>
    </div>
  );
}
