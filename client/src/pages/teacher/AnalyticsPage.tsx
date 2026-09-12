import { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { useClasses, useClassStudents } from "../../hooks/use-classes";
import { useStudentCompass, useStudentWeekly } from "../../hooks/use-students";
import { useHabits } from "../../hooks/use-habits";
import { useStudentLogbook } from "../../hooks/use-logbook";
import { downloadWeeklyReport } from "../../lib/excel-export";

// 7 Sapta habits metadata for compass display
const HABIT_META = [
  { id: 1, name: "Bangun Pagi", icon: "🌅", color: "#FFB703" },
  { id: 2, name: "Ibadah", icon: "🕌", color: "#8338EC" },
  { id: 3, name: "Olahraga", icon: "🏃", color: "#FF6B6B" },
  { id: 4, name: "Belajar", icon: "📚", color: "#4ECDC4" },
  { id: 5, name: "Gotong Royong", icon: "💛", color: "#E91E8C" },
  { id: 6, name: "Makan Sehat", icon: "🥗", color: "#2D9F4E" },
  { id: 7, name: "Tidur Cepat", icon: "😴", color: "#6C5CE7" },
];

/**
 * Teacher Analytics Page
 *
 * Shows class-wide analytics: student list with XP, streak,
 * and per-student detail drilldown with compass, weekly trend, and logbook.
 */
export function AnalyticsPage() {
  const { data: classes } = useClasses();
  const { data: habits } = useHabits();
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const activeClassId = selectedClassId || classes?.[0]?.id || 0;
  const { data: students, isLoading } = useClassStudents(activeClassId);

  // Ship level helper
  const getShipInfo = (xp: number) => {
    if (xp >= 600) return { emoji: "🚢", name: "Kapten Saptara" };
    if (xp >= 300) return { emoji: "⛵", name: "Kapal Pinisi" };
    if (xp >= 100) return { emoji: "🚣", name: "Sampan Dayung" };
    return { emoji: "🪵", name: "Rakit Bambu" };
  };

  // Aggregate stats
  const totalStudents = students?.length ?? 0;
  const avgXP = totalStudents > 0
    ? Math.round((students?.reduce((sum, s) => sum + s.xp, 0) ?? 0) / totalStudents)
    : 0;
  const avgStreak = totalStudents > 0
    ? Math.round((students?.reduce((sum, s) => sum + s.streak, 0) ?? 0) / totalStudents)
    : 0;
  const totalMissions = students?.reduce((sum, s) => sum + (s.xp > 0 ? Math.floor(s.xp / 10) : 0), 0) ?? 0;

  const selectedStudent = students?.find(s => s.id === selectedStudentId);

  return (
    <div className="teacher-page" id="teacher-analytics-page">
      <div className="page-header">
        <h1 className="page-title">📊 Analitik Kelas</h1>
        <p className="page-subtitle">Data performa para kapten cilik</p>
      </div>

      {/* Class selector */}
      <select
        className="class-selector"
        value={activeClassId}
        onChange={(e) => {
          setSelectedClassId(Number(e.target.value));
          setSelectedStudentId(null);
        }}
        id="analytics-class-select"
      >
        {classes?.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.shipName} — {cls.classCode}
          </option>
        ))}
      </select>

      {/* Summary cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <span className="summary-card__icon">👥</span>
          <span className="summary-card__value">{totalStudents}</span>
          <span className="summary-card__label">Kapten Cilik</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__icon">⚡</span>
          <span className="summary-card__value">{avgXP}</span>
          <span className="summary-card__label">Rata-rata mil</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__icon">🔥</span>
          <span className="summary-card__value">{avgStreak}</span>
          <span className="summary-card__label">Rata-rata Streak</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__icon">🎯</span>
          <span className="summary-card__value">{totalMissions}</span>
          <span className="summary-card__label">Total Misi</span>
        </div>
      </div>

      {/* Student list */}
      {isLoading ? (
        <p style={{ opacity: 0.6, textAlign: "center" }}>Memuat data...</p>
      ) : (
        <div className="analytics-students">
          <h3 className="section-title">📋 Daftar Kapten Cilik</h3>
          <p className="section-hint">Klik nama murid untuk melihat detail analisis</p>
          {students?.map((student) => {
            const ship = getShipInfo(student.xp);
            return (
              <div
                key={student.id}
                className={`analytics-student-row ${selectedStudentId === student.id ? "selected" : ""}`}
                onClick={() => setSelectedStudentId(
                  selectedStudentId === student.id ? null : student.id
                )}
              >
                <span className="student-row__avatar">{student.avatar}</span>
                <span className="student-row__name">{student.name}</span>
                <span className="student-row__ship" title={ship.name}>{ship.emoji}</span>
                <span className="student-row__xp">{student.xp} mil</span>
                <span className="student-row__streak">🔥 {student.streak}</span>
                <span className="student-row__coins">🪙 {student.coins}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Drilldown: selected student detail */}
      {selectedStudentId && selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          studentId={selectedStudentId}
          habits={habits}
          className={classes?.find(c => c.id === selectedClassId)?.shipName || classes?.find(c => c.id === selectedClassId)?.classCode || "Kelas 1"}
        />
      )}

      <Navbar role="teacher" />
    </div>
  );
}

// ══════════════════════════════════════════
// StudentDetail — Drilldown Component
// ══════════════════════════════════════════

interface StudentDetailProps {
  student: any;
  studentId: number;
  habits: any[] | undefined;
  className: string;
}

function StudentDetail({ student, studentId, habits, className }: StudentDetailProps) {
  const { data: compassRaw } = useStudentCompass(studentId);
  const { data: weeklyData } = useStudentWeekly(studentId);
  const { data: logEntries } = useStudentLogbook(studentId);

  // ── Download Excel ──
  const downloadExcel = async () => {
    await downloadWeeklyReport({
      student,
      habits: habits || HABIT_META,
      logEntries: logEntries || [],
      className,
      schoolName: "SDIT SAPTARA", // Or get from config if available
    });
  };

  // Ship info
  const getShipInfo = (xp: number) => {
    if (xp >= 600) return { emoji: "🚢", name: "Kapten Saptara", level: 4 };
    if (xp >= 300) return { emoji: "⛵", name: "Kapal Pinisi", level: 3 };
    if (xp >= 100) return { emoji: "🚣", name: "Sampan Dayung", level: 2 };
    return { emoji: "🪵", name: "Rakit Bambu", level: 1 };
  };

  const ship = getShipInfo(student.xp);

  // Merge compass data (Record<number, number>) with habit metadata
  const compassItems = HABIT_META.map(h => {
    const rawScore = compassRaw ? (compassRaw as any)[h.id] ?? (compassRaw as any)[String(h.id)] ?? 0 : 0;
    // Check habits from API for names
    const apiHabit = habits?.find(ah => ah.id === h.id);
    return {
      ...h,
      name: apiHabit?.name ?? h.name,
      icon: apiHabit?.icon ?? h.icon,
      score: rawScore,
    };
  });

  // Weekly data
  const maxCompleted = weeklyData ? Math.max(...weeklyData.map(d => d.completed), 1) : 1;

  // Logbook stats
  const totalEntries = logEntries?.length ?? 0;
  const verifiedEntries = logEntries?.filter(e => e.status === "verified").length ?? 0;
  const pendingEntries = logEntries?.filter(e => e.status === "pending").length ?? 0;
  const rejectedEntries = logEntries?.filter(e => e.status === "needs_revision" || e.status === "rejected").length ?? 0;

  const statusLabel = (status: string) => {
    switch (status) {
      case "verified": return "✅ Disetujui";
      case "pending": return "⏳ Menunggu";
      case "needs_revision": return "🔄 Perbaiki";
      case "rejected": return "❌ Ditolak";
      default: return status;
    }
  };

  return (
    <div className="analytics-drilldown" id="student-detail-drilldown">
      {/* Student header */}
      <div className="drilldown-header">
        <span className="drilldown-avatar">{student.avatar}</span>
        <div className="drilldown-info">
          <h3 className="drilldown-name">{student.name}</h3>
          <p className="drilldown-ship">{ship.emoji} {ship.name} • Level {ship.level}</p>
        </div>
        <button
          className="btn-download-excel"
          onClick={downloadExcel}
          title="Unduh laporan logbook siswa dalam format Excel"
        >
          📥 Unduh Excel
        </button>
      </div>

      {/* Student stats */}
      <div className="drilldown-stats">
        <div className="drilldown-stat">
          <span className="drilldown-stat__value">{student.xp}</span>
          <span className="drilldown-stat__label">mil</span>
        </div>
        <div className="drilldown-stat">
          <span className="drilldown-stat__value">{student.coins}</span>
          <span className="drilldown-stat__label">🪙 Koin</span>
        </div>
        <div className="drilldown-stat">
          <span className="drilldown-stat__value">{student.streak}</span>
          <span className="drilldown-stat__label">🔥 Streak</span>
        </div>
        <div className="drilldown-stat">
          <span className="drilldown-stat__value">{totalEntries}</span>
          <span className="drilldown-stat__label">📸 Logbook</span>
        </div>
      </div>

      {/* Compass / Radar bars */}
      <div className="drilldown-section">
        <h4 className="drilldown-section__title">🧭 Kompas 7 Karakter</h4>
        <div className="compass-bars">
          {compassItems.map((item) => (
            <div key={item.id} className="compass-bar-row">
              <span className="compass-bar__icon">{item.icon}</span>
              <span className="compass-bar__name">{item.name}</span>
              <div className="compass-bar__track">
                <div
                  className="compass-bar__fill"
                  style={{
                    width: `${Math.min(item.score, 100)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="compass-bar__score">{item.score}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly trend */}
      {weeklyData && (
        <div className="drilldown-section">
          <h4 className="drilldown-section__title">📊 Tren Mingguan</h4>
          <div className="weekly-chart">
            {weeklyData.map((day, i) => (
              <div key={i} className="weekly-bar-col">
                <div className="weekly-bar-wrapper">
                  <div
                    className="weekly-bar"
                    style={{
                      height: `${(day.completed / Math.max(maxCompleted, 7)) * 100}%`,
                    }}
                  >
                    <span className="weekly-bar__count">{day.completed}</span>
                  </div>
                </div>
                <span className="weekly-bar__day">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logbook summary */}
      <div className="drilldown-section">
        <h4 className="drilldown-section__title">📸 Ringkasan Logbook</h4>
        <div className="logbook-summary-stats">
          <span className="logbook-stat verified">✅ {verifiedEntries} Disetujui</span>
          <span className="logbook-stat pending">⏳ {pendingEntries} Menunggu</span>
          <span className="logbook-stat rejected">🔄 {rejectedEntries} Ditolak</span>
        </div>

        {/* Recent logbook entries */}
        {logEntries && logEntries.length > 0 && (
          <div className="drilldown-logbook-list">
            <h5 className="drilldown-subsection-title">Riwayat Terbaru</h5>
            {logEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className={`drilldown-logbook-entry status-${entry.status}`}>
                <div className="drilldown-logbook__header">
                  <span>{entry.habitIcon || "📋"} {entry.habitName || `Misi #${entry.habitId}`}</span>
                  <span className={`badge-${entry.status}`}>{statusLabel(entry.status)}</span>
                </div>
                <p className="drilldown-logbook__caption">{entry.caption}</p>
                <div className="drilldown-logbook__meta">
                  <span>📅 {entry.date}</span>
                  <span>🕐 {entry.time}</span>
                  {entry.xpEarned > 0 && <span>⚡ +{entry.xpEarned} mil</span>}
                </div>
                {entry.teacherComment && (
                  <div className="drilldown-logbook__feedback">
                    {entry.teacherSticker || "💬"} {entry.teacherComment}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
