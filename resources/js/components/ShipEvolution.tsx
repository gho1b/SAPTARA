import { useStudent } from "../hooks/use-students";
import { useStudentAccessories } from "../hooks/use-rewards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Progress } from "./ui/Progress";
import { Badge } from "./ui/Badge";
import { Sparkles, Anchor, ShieldCheck } from "lucide-react";
import type { ShipLevel } from "../types";

const SHIP_LEVELS: ShipLevel[] = [
  { level: 1, name: "Rakit Bambu", emoji: "🪵", minXP: 0, maxXP: 100, description: "Awal petualangan seorang penjelajah cilik!", ship: "raft" },
  { level: 2, name: "Sampan Dayung", emoji: "🚣", minXP: 100, maxXP: 300, description: "Mulai tangguh menghadapi gelombang samudra!", ship: "rowboat" },
  { level: 3, name: "Kapal Pinisi", emoji: "⛵", minXP: 300, maxXP: 600, description: "Pelaut Nusantara Agung yang pantang menyerah!", ship: "pinisi" },
  { level: 4, name: "Kapten Saptara", emoji: "🚢", minXP: 600, maxXP: 1000, description: "Penguasa Samudra 7 Kebiasaan Anak Indonesia Hebat!", ship: "saptara" },
];

function getShipLevel(xp: number): ShipLevel {
  if (xp >= 600) return SHIP_LEVELS[3];
  if (xp >= 300) return SHIP_LEVELS[2];
  if (xp >= 100) return SHIP_LEVELS[1];
  return SHIP_LEVELS[0];
}

interface ShipEvolutionProps {
  studentId: number;
}

export function ShipEvolution({ studentId }: ShipEvolutionProps) {
  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: accessories, isLoading: accessoriesLoading } = useStudentAccessories(studentId);

  if (studentLoading || accessoriesLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl bg-slate-50">
        <p className="text-xs text-slate-400 animate-pulse">Menyiapkan dermaga kapal...</p>
      </div>
    );
  }

  if (!student) return null;

  const currentLevel = getShipLevel(student.xp);
  const nextTarget = currentLevel.maxXP;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((student.xp - currentLevel.minXP) / (nextTarget - currentLevel.minXP)) * 100))
  );

  const ownedAccessories = accessories?.filter((a) => a.owned) ?? [];

  return (
    <div className="space-y-6">
      {/* Visual Ship Hero Card */}
      <Card className="relative overflow-hidden border-2 border-sky-200 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 text-white shadow-xl">
        <div className="relative z-10 flex flex-col items-center py-6 text-center">
          <Badge variant="gold" className="mb-3">
            Tingkat {currentLevel.level} • {currentLevel.name}
          </Badge>

          {/* Animated Ship Emoji */}
          <div className="relative my-2 flex h-28 w-28 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm text-7xl shadow-2xl border-2 border-white/40 animate-bounce">
            {currentLevel.emoji}
          </div>

          <h3 className="font-display text-2xl font-bold tracking-wide mt-2">{currentLevel.name}</h3>
          <p className="max-w-md text-xs text-sky-100 mt-1 px-4 leading-relaxed font-medium">
            "{currentLevel.description}"
          </p>

          {/* XP Milestones */}
          <div className="mt-6 w-full max-w-sm px-4">
            <div className="flex justify-between text-xs font-bold text-sky-100 mb-1.5">
              <span>⚡ {student.xp} mil terlalui</span>
              <span>🎯 Target {nextTarget} mil</span>
            </div>
            <Progress
              value={progressPercent}
              className="h-3.5 bg-sky-950/30 border border-white/20"
              indicatorColor="bg-gradient-to-r from-amber-300 to-amber-400"
            />
            <p className="text-[11px] text-sky-200 text-center mt-1 font-medium">
              Tinggal <span className="font-bold text-amber-300">{Math.max(0, nextTarget - student.xp)} mil</span> lagi menuju kapal berikutnya!
            </p>
          </div>
        </div>
      </Card>

      {/* 4 Ship Progression Tiers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SHIP_LEVELS.map((sl) => {
          const isUnlocked = student.xp >= sl.minXP;
          const isCurrent = currentLevel.level === sl.level;

          return (
            <Card
              key={sl.level}
              className={`p-4 text-center transition-all ${
                isCurrent
                  ? "border-2 border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-200"
                  : isUnlocked
                  ? "border-slate-200 bg-white"
                  : "border-slate-200/60 bg-slate-50 opacity-60"
              }`}
            >
              <div className="text-3xl mb-1">{sl.emoji}</div>
              <h4 className="font-bold text-xs text-slate-800">{sl.name}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{sl.minXP} - {sl.maxXP} mil</p>
              <div className="mt-2">
                {isCurrent ? (
                  <Badge variant="gold" className="text-[10px] px-2 py-0">Kapal Saat Ini</Badge>
                ) : isUnlocked ? (
                  <Badge variant="success" className="text-[10px] px-2 py-0">Terbuka</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-2 py-0">Terkunci</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Equipped Ship Accessories */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-sky-600" />
            <div>
              <CardTitle className="text-base">Hiasan & Aksesoris Kapal</CardTitle>
              <CardDescription>Aksesoris yang telah kamu beli dengan koin emas kebiasaan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ownedAccessories.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">
              Belum ada aksesoris yang terpasang. Tukarkan koin emasmu di toko aksesoris!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ownedAccessories.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-xs font-semibold text-slate-700"
                >
                  <span className="text-2xl">{item.icon || "🎁"}</span>
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-emerald-600">Terpasang</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
