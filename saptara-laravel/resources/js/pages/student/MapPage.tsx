import { useState } from "react";
import { useStudentInfo } from "../../hooks/use-auth";
import { useStudentDashboard } from "../../hooks/use-students";
import { useTodayMissions, useToggleHabit } from "../../hooks/use-habits";
import { OceanMap } from "../../components/OceanMap";
import { DailyQuests } from "../../components/DailyQuests";
import { Mascot } from "../../components/Mascot";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CheckCircle2, Circle, Flame, Sparkles, Navigation, Trophy, Coins, X } from "lucide-react";
import confetti from "canvas-confetti";
import type { MilestoneReward } from "../../types";

export function MapPage() {
  const studentInfo = useStudentInfo();
  const studentId = studentInfo?.studentId ?? 0;
  const { data: dashboard } = useStudentDashboard(studentId);
  const { data: missions, isLoading: missionsLoading } = useTodayMissions(studentId);
  const toggleMutation = useToggleHabit(studentId);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneReward | null>(null);

  const handleToggle = async (habitId: number, currentlyCompleted: boolean) => {
    try {
      const res = await toggleMutation.mutateAsync(habitId);
      if (res.action === "completed" || (res.completed && !currentlyCompleted)) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#0ea5e9", "#f59e0b", "#10b981"],
        });

        if (res.milestoneReward) {
          setActiveMilestone(res.milestoneReward);
          confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.5 },
            colors: ["#ffd700", "#ff69b4", "#00ffff", "#10b981"],
          });
        }
      }
    } catch {
      // ignore
    }
  };

  const completedCount = missions?.filter((m) => m.completed).length ?? 0;
  const totalCount = missions?.length ?? 7;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-6">
      {/* Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 p-6 text-white shadow-lg shadow-sky-500/15">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-3xl shadow-inner border border-white/30">
            {studentInfo?.avatar || "🧒"}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Ahoy, {studentInfo?.name || "Kapten"}! 🌊
            </h1>
            <p className="text-xs text-sky-100 mt-0.5">
              Siap berlayar menaklukkan 7 kebiasaan mulia hari ini?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="gold" className="text-xs px-3 py-1">
            {dashboard?.shipLevel?.name || "Rakit Bambu"} {dashboard?.shipLevel?.emoji || "🪵"}
          </Badge>
          <div className="flex items-center gap-1 rounded-xl bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
            <Flame className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>Streak: {dashboard?.streak ?? 0} Hari</span>
          </div>
        </div>
      </div>

      {/* Ocean Map of 7 Islands */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-sky-600" />
              <span>Peta Samudra Kebiasaan</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ketuk pulau untuk melihat misi dan mencatat jurnal fotomu
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedCount} dari {totalCount} Selesai
          </Badge>
        </div>

        <OceanMap studentId={studentId} />
      </div>

      {/* Daily Quests Section (Phase 17) */}
      <DailyQuests studentId={studentId} />

      {/* Today's Mission Checklist */}
      <Card className="border-sky-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base text-slate-800">
                Daftar Misi Harian
              </CardTitle>
              <CardDescription>
                Centang kebiasaan yang sudah kamu lakukan hari ini untuk mendapatkan koin dan jarak mil!
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              <span>+{completedCount * 10} mil didapat</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {missionsLoading ? (
            <p className="text-center py-6 text-xs text-slate-400">Memuat misi hari ini...</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {missions?.map((m) => {
                const habit = m.habit;
                const isCompleted = m.completed;

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggle(habit.id, isCompleted)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isCompleted
                        ? "bg-emerald-50/70 border-emerald-300/80 shadow-xs"
                        : "bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold ${isCompleted ? "text-emerald-950 line-through opacity-80" : "text-slate-800"}`}>
                            {habit.name}
                          </h4>
                          {habit.is_custom && (
                            <span className="text-[10px] bg-sky-100 text-sky-700 font-semibold px-1.5 py-0.2 rounded">
                              Khusus Kelas
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{habit.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={toggleMutation.isPending}
                      className="text-emerald-600 hover:scale-110 transition-transform cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-100" />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-300 hover:text-sky-400" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak Milestone Reward Modal */}
      {activeMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-amber-50 to-white p-6 shadow-2xl border-2 border-amber-300 text-center relative">
            <button
              onClick={() => setActiveMilestone(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-3xl shadow-lg shadow-amber-400/30 mb-4 animate-bounce">
              <Trophy className="h-8 w-8 text-amber-900" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              Milestone Streak Tercapai!
            </span>

            <h3 className="font-display text-xl font-black text-slate-800">
              {activeMilestone.title}
            </h3>

            <p className="text-xs text-slate-600 mt-1 mb-4">
              Luar biasa! Kamu telah konsisten menjalankan kebiasaan baik selama {activeMilestone.days} hari berturut-turut tanpa jeda!
            </p>

            <div className="flex items-center justify-center gap-3 bg-amber-100/60 rounded-2xl p-3.5 mb-5 border border-amber-200">
              <div className="flex items-center gap-1.5 text-sky-800 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span>+{activeMilestone.bonus_xp} XP</span>
              </div>
              <span className="text-amber-300 font-bold">•</span>
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
                <Coins className="h-4 w-4 text-amber-600" />
                <span>+{activeMilestone.bonus_coins} Koin</span>
              </div>
            </div>

            <Button
              onClick={() => setActiveMilestone(null)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 rounded-2xl shadow-md shadow-amber-500/25"
            >
              Ambil & Terus Berlayar! ⛵
            </Button>
          </div>
        </div>
      )}

      {/* Floating friendly mascot */}
      <Mascot />
    </div>
  );
}
