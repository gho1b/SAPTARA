import { useHabits } from "../hooks/use-habits";
import { useStudentCompass } from "../hooks/use-students";

interface RadarChartProps {
  studentId: number;
}

export function RadarChart({ studentId }: RadarChartProps) {
  const { data: rawScores, isLoading: scoresLoading } = useStudentCompass(studentId);
  const { data: habits, isLoading: habitsLoading } = useHabits();

  const isLoading = scoresLoading || habitsLoading;

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50/50">
        <p className="text-xs font-semibold text-slate-400 animate-pulse">Memuat kompas karakter...</p>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50/50">
        <p className="text-xs text-slate-400">Belum ada data kompas</p>
      </div>
    );
  }

  const scoreMap = (rawScores as unknown as Record<number, number>) ?? {};
  const scores = habits.map((h) => ({
    habitId: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color || "#0ea5e9",
    score: scoreMap[h.id] ?? 0,
  }));

  const numAxes = scores.length;
  const centerX = 160;
  const centerY = 160;
  const maxRadius = 110;
  const angleStep = (2 * Math.PI) / numAxes;

  // Calculate polygon points
  const dataPoints = scores.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = Math.max(12, (item.score / 100) * maxRadius);
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[340px]">
        <svg viewBox="0 0 320 320" className="w-full h-auto overflow-visible">
          {/* Circular/Web Grid */}
          {gridLevels.map((lvl) => (
            <circle
              key={lvl}
              cx={centerX}
              cy={centerY}
              r={maxRadius * lvl}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray={lvl === 1.0 ? "none" : "3,3"}
            />
          ))}

          {/* Radial axis lines */}
          {scores.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const endX = centerX + maxRadius * Math.cos(angle);
            const endY = centerY + maxRadius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled polygon area */}
          <path
            d={dataPath}
            fill="rgba(14, 165, 233, 0.25)"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {dataPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill={scores[i].color}
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          {/* Axis icon and percentage labels */}
          {scores.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = maxRadius + 26;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);

            return (
              <text
                key={i}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-bold fill-slate-700 select-none"
              >
                {item.icon} {item.score}%
              </text>
            );
          })}
        </svg>
      </div>

      {/* Habit breakdown pills */}
      <div className="mt-4 grid grid-cols-2 gap-2 w-full sm:grid-cols-3 text-xs">
        {scores.map((item) => (
          <div
            key={item.habitId}
            className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-1.5"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span>{item.icon}</span>
              <span className="truncate text-slate-700 font-medium">{item.name}</span>
            </div>
            <span className="font-bold text-sky-600 ml-1">{item.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
