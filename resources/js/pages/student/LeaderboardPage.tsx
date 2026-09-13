import { useStudentInfo } from "../../hooks/use-auth";
import { Leaderboard } from "../../components/Leaderboard";
import { Trophy } from "lucide-react";

export function LeaderboardPage() {
  const studentInfo = useStudentInfo();
  const classId = studentInfo?.classId ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <span>Papan Peringkat Pelayaran Kelas</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lihat kapten-kapten cilik paling gigih dan rajin menjalankan kebiasaan baik di kelasmu
        </p>
      </div>

      <Leaderboard classId={classId} />
    </div>
  );
}
