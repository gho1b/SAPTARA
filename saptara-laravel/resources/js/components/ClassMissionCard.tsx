import { useState } from "react";
import { useClassMissions, useClaimClassMission } from "../hooks/use-missions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Ship, Sparkles, Coins, Gift, CheckCircle2, Clock, Users, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface ClassMissionCardProps {
  classId: number;
  studentId: number;
}

export function ClassMissionCard({ classId, studentId }: ClassMissionCardProps) {
  const { data: missions, isLoading } = useClassMissions(classId, studentId);
  const claimMutation = useClaimClassMission(classId, studentId);
  const [claimedNotice, setClaimedNotice] = useState(false);

  if (isLoading || !missions || missions.length === 0) {
    return null;
  }

  const mission = missions[0]; // Misi aktif utama kelas

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync(mission.id);
      setClaimedNotice(true);
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#0284c7", "#f59e0b", "#10b981", "#ec4899", "#ffd700"],
      });
      setTimeout(() => setClaimedNotice(false), 5000);
    } catch (err: any) {
      alert(err.message || "Gagal mengklaim hadiah misi kelas");
    }
  };

  return (
    <Card className="border-sky-200/90 shadow-lg bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white overflow-hidden relative">
      {/* Background nautical wave graphics */}
      <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none text-white">
        <Ship className="w-56 h-56" />
      </div>

      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-2xl border border-white/30 shadow-inner">
              ⛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>{mission.title}</span>
                </CardTitle>
                <span className="text-[10px] bg-amber-400/90 text-amber-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Tantangan Kelas
                </span>
              </div>
              <CardDescription className="text-xs text-sky-100 mt-0.5 line-clamp-1">
                {mission.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center text-xs font-bold">
            <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-white border border-white/20">
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              <span>{mission.days_left > 0 ? `${mission.days_left} Hari Lagi` : "Hari Terakhir!"}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {claimedNotice && (
          <div className="rounded-xl bg-emerald-500/90 border border-emerald-300 p-3 text-xs text-white font-bold flex items-center gap-2 animate-bounce shadow-md">
            <Trophy className="h-4 w-4 text-yellow-300 flex-shrink-0" />
            <span>Hore! Hadiah Ekspedisi Kelas berhasil ditambahkan ke profilmu! 🎉</span>
          </div>
        )}

        {/* Ocean Sailing Progress Track */}
        <div className="space-y-1.5 bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
          <div className="flex items-center justify-between text-xs font-bold text-sky-100">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-sky-200" />
              <span>Progres Seluruh Awak Kapal</span>
            </span>
            <span className="font-display text-sm font-black text-amber-300">
              {mission.current_progress} / {mission.target_count} ({mission.percentage}%)
            </span>
          </div>

          {/* Sea Progress Bar with sailing ship */}
          <div className="relative pt-6 pb-2">
            {/* Animated Ship on track */}
            <div
              className="absolute -top-1 transition-all duration-700 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${Math.max(4, Math.min(96, mission.percentage))}%` }}
            >
              <span className="text-xl filter drop-shadow-md animate-bounce">
                {mission.completed ? "🏆" : "⛵"}
              </span>
            </div>

            {/* Sea Bar */}
            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden p-0.5 border border-white/30">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  mission.completed
                    ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 shadow-lg shadow-emerald-400/50"
                    : "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 shadow-md shadow-amber-400/40"
                }`}
                style={{ width: `${mission.percentage}%` }}
              />
            </div>
          </div>

          {/* Rewards info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-2 text-sky-100">
              <span>Hadiah Tiap Siswa:</span>
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md font-bold text-white border border-white/20">
                <Sparkles className="h-3 w-3 text-amber-300" />
                +{mission.reward_xp_each} XP
              </span>
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md font-bold text-white border border-white/20">
                <Coins className="h-3 w-3 text-amber-300" />
                +{mission.reward_coins_each} Koin
              </span>
            </div>

            {/* Claim / Status */}
            <div>
              {mission.claimed ? (
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-white/10 px-3 py-1 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Hadiah Sudah Diklaim</span>
                </div>
              ) : mission.completed ? (
                <Button
                  size="sm"
                  onClick={handleClaim}
                  disabled={claimMutation.isPending}
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-xs shadow-lg shadow-amber-400/30 px-4 py-2 rounded-xl animate-pulse cursor-pointer"
                >
                  <Gift className="h-4 w-4 mr-1.5" />
                  {claimMutation.isPending ? "Mengklaim..." : "Klaim Hadiah Ekspedisi Kelas!"}
                </Button>
              ) : (
                <span className="text-[11px] text-sky-200 font-medium">
                  {mission.target_count - mission.current_progress} kebiasaan lagi untuk menang bersama!
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
