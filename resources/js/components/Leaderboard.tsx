import { useLeaderboard } from "../hooks/use-students";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Trophy, Flame, Sparkles } from "lucide-react";

interface LeaderboardProps {
  classId: number;
}

function getShipEmoji(xp: number): string {
  if (xp >= 600) return "🚢";
  if (xp >= 300) return "⛵";
  if (xp >= 100) return "🚣";
  return "🪵";
}

export function Leaderboard({ classId }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useLeaderboard(classId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl bg-slate-50">
        <p className="text-xs text-slate-400 animate-pulse">Menghitung jarak mil pelayaran...</p>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="text-center py-12 bg-slate-50/50">
        <Trophy className="h-10 w-10 text-amber-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Belum ada catatan pelayaran kelas</p>
        <p className="text-xs text-slate-400 mt-1">Ayo mulai jalankan 7 kebiasaan baik untuk menjadi juara!</p>
      </Card>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-3 pt-6 pb-4">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div className="flex flex-col items-center w-28 sm:w-36">
              <div className="relative mb-2">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl shadow-md border-2 border-slate-300">
                  {topThree[1].avatar || "🧒"}
                </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 font-bold text-xs text-slate-800 shadow-sm">
                  🥈
                </span>
              </div>
              <p className="font-bold text-xs text-slate-800 truncate w-full text-center">{topThree[1].name}</p>
              <p className="text-[11px] font-semibold text-sky-600">{topThree[1].xp} mil</p>
              <div className="mt-2 h-20 w-full rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 flex items-center justify-center border-t-2 border-slate-300">
                <span className="font-display font-bold text-xl text-slate-500">2</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div className="flex flex-col items-center w-32 sm:w-40 -mt-6">
              <div className="relative mb-2">
                <div className="flex h-18 w-18 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-amber-50 text-4xl shadow-xl border-3 border-amber-400 ring-4 ring-amber-100">
                  {topThree[0].avatar || "🧒"}
                </div>
                <span className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 font-bold text-sm text-amber-950 shadow-md">
                  👑
                </span>
              </div>
              <p className="font-bold text-sm text-slate-900 truncate w-full text-center">{topThree[0].name}</p>
              <p className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> {topThree[0].xp} mil
              </p>
              <div className="mt-2 h-28 w-full rounded-t-2xl bg-gradient-to-t from-amber-200 to-amber-100 flex items-center justify-center border-t-2 border-amber-300 shadow-md">
                <span className="font-display font-bold text-3xl text-amber-700">1</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div className="flex flex-col items-center w-28 sm:w-36">
              <div className="relative mb-2">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl shadow-md border-2 border-amber-700/30">
                  {topThree[2].avatar || "🧒"}
                </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/30 font-bold text-xs text-amber-900 shadow-sm">
                  🥉
                </span>
              </div>
              <p className="font-bold text-xs text-slate-800 truncate w-full text-center">{topThree[2].name}</p>
              <p className="text-[11px] font-semibold text-sky-600">{topThree[2].xp} mil</p>
              <div className="mt-2 h-16 w-full rounded-t-2xl bg-gradient-to-t from-amber-100/70 to-slate-100 flex items-center justify-center border-t-2 border-amber-300/50">
                <span className="font-display font-bold text-xl text-amber-800">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remaining Leaderboard Table */}
      <Card className="p-2 sm:p-4">
        <div className="divide-y divide-slate-100">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.studentId}
              className={`flex items-center justify-between py-3 px-3 rounded-xl transition-colors ${
                idx < 3 ? "bg-slate-50/70 font-semibold" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center font-bold text-xs text-slate-400">
                  #{idx + 1}
                </span>
                <span className="text-2xl">{entry.avatar || "🧒"}</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{entry.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    {getShipEmoji(entry.xp)} Kapal Tingkat
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{entry.streak}</span>
                </div>
                <span className="font-extrabold text-xs text-sky-600 min-w-16 text-right">
                  {entry.xp} mil
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
