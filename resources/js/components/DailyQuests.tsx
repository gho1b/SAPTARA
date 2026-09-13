import { useDailyQuests, useClaimQuest } from "../hooks/use-quests";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { CheckCircle2, Gift, Sparkles, Coins, Compass } from "lucide-react";
import confetti from "canvas-confetti";
import { useState } from "react";

interface DailyQuestsProps {
  studentId: number;
}

export function DailyQuests({ studentId }: DailyQuestsProps) {
  const { data, isLoading } = useDailyQuests(studentId);
  const claimMutation = useClaimQuest(studentId);
  const [claimSuccessKey, setClaimSuccessKey] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="border-amber-100 shadow-sm bg-gradient-to-br from-amber-50/40 via-white to-sky-50/30">
        <CardContent className="p-6 text-center text-sm text-slate-400">
          Memuat misi harian samudra...
        </CardContent>
      </Card>
    );
  }

  const quests = data?.quests ?? [];
  const claimedCount = quests.filter((q) => q.claimed).length;

  const handleClaim = async (questKey: string) => {
    try {
      await claimMutation.mutateAsync(questKey);
      setClaimSuccessKey(questKey);
      setTimeout(() => setClaimSuccessKey(null), 4000);

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#10b981", "#0284c7", "#ec4899"],
      });
    } catch {
      // Error handled by react-query / api
    }
  };

  return (
    <Card className="border-amber-200/80 shadow-md bg-gradient-to-br from-amber-50/60 via-white to-sky-50/40 overflow-hidden relative">
      {/* Decorative maritime background element */}
      <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none text-amber-900">
        <Compass className="w-48 h-48" />
      </div>

      <CardHeader className="pb-3 border-b border-amber-100/80 bg-amber-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-inner">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display text-base font-bold text-slate-800 flex items-center gap-1.5">
                <span>Misi Harian Nakhoda</span>
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  Daily Quests
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Selesaikan tantangan hari ini untuk ekstra XP dan Koin Bahari!
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 self-start sm:self-center font-bold text-xs">
            {claimedCount} / {quests.length} Diklaim
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {claimSuccessKey && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-bounce">
            <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Selamat! Hadiah berhasil ditambahkan ke peti hartamu! 🎉</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

            return (
              <div
                key={quest.key}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 ${
                  quest.claimed
                    ? "bg-slate-50/80 border-slate-200/80 opacity-75"
                    : quest.completed
                    ? "bg-gradient-to-b from-amber-50 to-white border-amber-300 shadow-sm ring-2 ring-amber-200/50"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{quest.icon}</span>
                      <div>
                        <h4 className="font-display text-sm font-bold text-slate-800 leading-snug">
                          {quest.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                          {quest.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Progres</span>
                      <span>
                        {quest.progress} / {quest.target}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          quest.completed
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-sky-400 to-blue-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Rewards preview */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold">
                    <span className="text-slate-400 font-normal">Hadiah:</span>
                    <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                      <Sparkles className="h-3 w-3 text-sky-500" />
                      +{quest.rewardXp} XP
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Coins className="h-3 w-3 text-amber-500" />
                      +{quest.rewardCoins} Koin
                    </span>
                  </div>
                </div>

                {/* Claim / Action Button */}
                <div className="mt-4 pt-2 border-t border-slate-100">
                  {quest.claimed ? (
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 py-1.5 bg-emerald-50 rounded-xl">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Sudah Diklaim</span>
                    </div>
                  ) : quest.completed ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(quest.key)}
                      disabled={claimMutation.isPending}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 py-2 rounded-xl transition-transform active:scale-95 animate-pulse"
                    >
                      <Gift className="h-3.5 w-3.5 mr-1" />
                      {claimMutation.isPending ? "Mengklaim..." : "Klaim Hadiah!"}
                    </Button>
                  ) : (
                    <div className="text-center text-[11px] font-medium text-slate-400 py-1.5 bg-slate-50 rounded-xl">
                      Belum Selesai ({quest.progress}/{quest.target})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
