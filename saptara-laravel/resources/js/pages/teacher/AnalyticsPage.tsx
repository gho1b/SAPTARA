import { useState, useEffect } from "react";
import { useClasses } from "../../hooks/use-classes";
import { useStudentsByClass, useLeaderboard } from "../../hooks/use-students";
import { useClassLogbook } from "../../hooks/use-logbook";
import { useHabits } from "../../hooks/use-habits";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { BarChart3, Users, Award, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";

import { HabitHeatmap } from "../../components/HabitHeatmap";

export function AnalyticsPage() {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [heatmapStudentId, setHeatmapStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classId = selectedClassId ?? 0;
  const { data: students, isLoading: studentsLoading } = useStudentsByClass(classId);
  const { data: leaderboard } = useLeaderboard(classId);
  const { data: logbooks } = useClassLogbook(classId);
  const { data: habits } = useHabits();

  useEffect(() => {
    if (students && students.length > 0) {
      if (!heatmapStudentId || !students.some((s) => s.id === heatmapStudentId)) {
        setHeatmapStudentId(students[0].id);
      }
    } else {
      setHeatmapStudentId(null);
    }
  }, [students, heatmapStudentId]);

  const selectedStudent = students?.find((s) => s.id === heatmapStudentId);

  const totalStudents = students?.length ?? 0;
  const totalVerified = logbooks?.filter((l) => l.status === "verified").length ?? 0;
  const totalPending = logbooks?.filter((l) => l.status === "pending").length ?? 0;

  // Inactive students (streak === 0)
  const inactiveStudents = students?.filter((s) => s.streak === 0) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-6">
      {/* Header & Class Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-sky-600" />
            <span>Analitik Perkembangan Kelas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan keterlaksanaan 7 kebiasaan dan keaktifan siswa
          </p>
        </div>

        {classes && classes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kelas:</span>
            <select
              value={selectedClassId ?? ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.schoolName || c.school_name} ({c.classCode || c.class_code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Users className="h-4 w-4 text-sky-500" />
            <span>Total Siswa</span>
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 mt-2">{totalStudents}</p>
          <span className="text-[10px] text-slate-400">Terdaftar di kelas</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Jurnal Terverifikasi</span>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600 mt-2">{totalVerified}</p>
          <span className="text-[10px] text-emerald-600/80 font-medium">Foto kegiatan disetujui</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Menunggu Review</span>
          </div>
          <p className="font-display text-2xl font-bold text-amber-600 mt-2">{totalPending}</p>
          <span className="text-[10px] text-amber-600/80 font-medium">Antrean verifikasi</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Award className="h-4 w-4 text-purple-500" />
            <span>Kapten Terbaik</span>
          </div>
          <p className="font-display text-lg font-bold text-slate-900 truncate mt-2">
            {leaderboard?.[0]?.name || "-"}
          </p>
          <span className="text-[10px] text-purple-600 font-medium">
            {leaderboard?.[0]?.xp ?? 0} mil pelayaran
          </span>
        </Card>
      </div>

      {/* Inactive Student Alerts */}
      {inactiveStudents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-sm font-bold">Perlu Perhatian & Motivasi</CardTitle>
            </div>
            <CardDescription className="text-amber-800/80">
              Siswa berikut belum aktif mencatat kebiasaan hari ini. Berikan sapaan atau pesan motivasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inactiveStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800"
                >
                  <span>{s.avatar || "🧒"}</span>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7 Habits Implementation Overview */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Tingkat Keterlaksanaan 7 Kebiasaan Kelas</CardTitle>
          <CardDescription>Gambaran ketercapaian setiap kebiasaan anak di kelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {habits?.map((habit) => {
              const habitEntries = logbooks?.filter((l) => l.habitId === habit.id) ?? [];
              const verifiedHabit = habitEntries.filter((l) => l.status === "verified").length;

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{habit.name}</h4>
                      <p className="text-[10px] text-slate-400">{habit.island}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {verifiedHabit} Catatan
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap 60 Hari Siswa */}
      {students && students.length > 0 && heatmapStudentId && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Kalender Jejak Kebiasaan Siswa</h3>
              <p className="text-xs text-slate-400">
                Pilih siswa untuk melihat intensitas pembiasaan 60 hari terakhir
              </p>
            </div>
            <select
              value={heatmapStudentId}
              onChange={(e) => setHeatmapStudentId(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.avatar} {s.name} ({s.xp} mil)
                </option>
              ))}
            </select>
          </div>

          <HabitHeatmap
            studentId={heatmapStudentId}
            studentName={selectedStudent ? `${selectedStudent.avatar} ${selectedStudent.name}` : undefined}
          />
        </div>
      )}
    </div>
  );
}
