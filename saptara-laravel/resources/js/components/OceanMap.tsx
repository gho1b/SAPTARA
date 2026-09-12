import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useHabits, useTodayMissions } from "../hooks/use-habits";

interface OceanMapProps {
  studentId: number;
}

export function OceanMap({ studentId }: OceanMapProps) {
  const navigate = useNavigate();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: missions, isLoading: missionsLoading } = useTodayMissions(studentId);

  if (habitsLoading || missionsLoading) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-3xl border border-sky-200 bg-sky-50/50">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl animate-bounce">⛵</span>
          <p className="text-sm font-semibold text-sky-700">Membuka peta samudra...</p>
        </div>
      </div>
    );
  }

  const completedMap = new Map(
    missions?.map((m) => [m.habit?.id ?? 0, m.completed]) ?? []
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-sky-200 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500 p-4 sm:p-8 shadow-inner shadow-sky-600/30">
      {/* Decorative Ocean Elements */}
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="waves" width="60" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 Q 15 0 30 10 T 60 10" fill="none" stroke="#fff" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      </div>

      {/* Center Flag / Ship */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-80">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs text-3xl shadow-lg animate-pulse">
          ⛵
        </div>
        <span className="text-[10px] font-bold text-sky-950 uppercase tracking-widest bg-white/40 px-2 py-0.5 rounded-full mt-1">
          Samudra Karakter
        </span>
      </div>

      {/* Grid of Habit Islands (Responsive for Mobile & Desktop) */}
      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {habits?.map((habit, index) => {
          const isCompleted = completedMap.get(habit.id) ?? false;

          return (
            <div
              key={habit.id}
              onClick={() => navigate(`/student/logbook?habitId=${habit.id}`)}
              className={`group relative flex flex-col items-center justify-between rounded-2xl p-4 transition-all duration-300 cursor-pointer text-center select-none ${
                isCompleted
                  ? "bg-white/95 text-slate-800 shadow-lg border-2 border-emerald-400 ring-2 ring-emerald-200"
                  : "bg-white/80 backdrop-blur-xs text-slate-700 shadow-md hover:bg-white hover:scale-105 hover:shadow-xl border-2 border-transparent"
              } ${index === 6 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              {/* Completed Check Badge */}
              {isCompleted && (
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}

              {/* Island Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-3xl shadow-xs group-hover:scale-110 transition-transform">
                {habit.icon}
              </div>

              {/* Island Name */}
              <div className="mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
                  {habit.island}
                </span>
                <h4 className="font-bold text-xs text-slate-800 leading-snug mt-0.5">
                  {habit.name}
                </h4>
              </div>

              {/* Status footer button */}
              <div className="mt-3 w-full">
                {isCompleted ? (
                  <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 rounded-lg">
                    <Sparkles className="h-3 w-3" /> Selesai Hari Ini
                  </span>
                ) : (
                  <span className="flex items-center justify-center text-[10px] font-semibold text-slate-500 bg-slate-100 py-1 rounded-lg group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    Catat Jurnal 📸
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
