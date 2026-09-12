import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { useParentInfo, useParentLogout } from "../../hooks/use-auth";
import { apiParentFetch } from "../../lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { LogbookEntry } from "../../types";

// 7 Sapta habits metadata
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
 * Parent Analytics Page (Read-Only)
 *
 * Menampilkan statistik dan riwayat logbook siswa.
 * Orang tua tidak memiliki tombol download Excel atau aksi lainnya.
 */
export function ParentAnalyticsPage() {
  const navigate = useNavigate();
  const parentInfo = useParentInfo();
  const { logout } = useParentLogout();
  const classId = parentInfo?.classId ?? 0;
  const studentId = parentInfo?.studentId ?? 0;
  const [showDetail, setShowDetail] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // Fetch class students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["parent-students", classId],
    queryFn: () => apiParentFetch<any[]>(`/api/classes/parent/students`),
    enabled: !!classId,
  });

  // Fetch compass data for own child
  const { data: compassRaw } = useQuery({
    queryKey: ["parent-compass", studentId],
    queryFn: () => apiParentFetch<Record<number, number>>(`/api/students/${studentId}/compass`),
    enabled: !!studentId,
  });

  // Fetch weekly data for own child
  const { data: weeklyData } = useQuery({
    queryKey: ["parent-weekly", studentId],
    queryFn: () => apiParentFetch<any[]>(`/api/students/${studentId}/weekly`),
    enabled: !!studentId,
  });

  // Fetch logbook for own child
  const { data: logEntries } = useQuery({
    queryKey: ["parent-logbook-student", studentId],
    queryFn: () => apiParentFetch<LogbookEntry[]>(`/api/logbook/student/${studentId}`),
    enabled: !!studentId,
  });

  const totalStudents = students?.length ?? 0;
  const avgXP = totalStudents > 0
    ? Math.round((students?.reduce((s: number, st: any) => s + st.xp, 0) ?? 0) / totalStudents)
    : 0;

  const compassItems = HABIT_META.map((h) => ({
    ...h,
    score: compassRaw ? (compassRaw as any)[h.id] ?? 0 : 0,
  }));

  const maxCompleted = weeklyData ? Math.max(...weeklyData.map((d) => d.completed), 1) : 1;

  const totalEntries = logEntries?.length ?? 0;
  const verifiedEntries = logEntries?.filter((e) => e.status === "verified").length ?? 0;
  const pendingEntries = logEntries?.filter((e) => e.status === "pending").length ?? 0;

  const statusLabel = (status: string) => {
    switch (status) {
      case "verified": return "✅ Disetujui";
      case "pending": return "⏳ Menunggu";
      case "needs_revision": return "🔄 Perbaiki";
      case "rejected": return "❌ Ditolak";
      default: return status;
    }
  };

  const getShipInfo = (xp: number) => {
    if (xp >= 600) return { emoji: "🚢", name: "Kapten Saptara" };
    if (xp >= 300) return { emoji: "⛵", name: "Kapal Pinisi" };
    if (xp >= 100) return { emoji: "🚣", name: "Sampan Dayung" };
    return { emoji: "🪵", name: "Rakit Bambu" };
  };

  const myChild = students?.find((s: any) => s.id === studentId);
  const childShip = getShipInfo(myChild?.xp ?? 0);

  return (
    <div className="teacher-page" id="parent-analytics-page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div>
            <h1 className="page-title">📊 Analitik Anak</h1>
            <p className="page-subtitle">
              Performa {parentInfo?.studentName ?? "anak"} di kelasnya
            </p>
          </div>
          <button
            className="btn-parent-logout"
            onClick={handleLogout}
            type="button"
            title="Keluar"
          >
            🚪 Keluar
          </button>
        </div>
      </div>

      {/* Class summary cards */}
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
          <span className="summary-card__icon">📸</span>
          <span className="summary-card__value">{totalEntries}</span>
          <span className="summary-card__label">Total Logbook</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__icon">✅</span>
          <span className="summary-card__value">{verifiedEntries}</span>
          <span className="summary-card__label">Disetujui</span>
        </div>
      </div>

      {/* Child detail section */}
      {studentsLoading ? (
        <p style={{ opacity: 0.6, textAlign: "center" }}>Memuat data...</p>
      ) : (
        <div className="analytics-students">
          <h3 className="section-title">🧒 Detail Anak Saya</h3>
          <p className="section-hint">Klik untuk melihat detail analisis</p>

          {myChild && (
            <div
              className={`analytics-student-row ${showDetail ? "selected" : ""}`}
              onClick={() => setShowDetail(!showDetail)}
            >
              <span className="student-row__avatar">{myChild.avatar}</span>
              <span className="student-row__name">{myChild.name}</span>
              <span className="student-row__ship" title={childShip.name}>{childShip.emoji}</span>
              <span className="student-row__xp">{myChild.xp} mil</span>
              <span className="student-row__streak">🔥 {myChild.streak}</span>
              <span className="student-row__coins">🪙 {myChild.coins}</span>
            </div>
          )}
        </div>
      )}

      {/* Drilldown detail — read-only, no download button */}
      {showDetail && myChild && (
        <div className="analytics-drilldown" id="parent-student-detail">
          {/* Header tanpa tombol download */}
          <div className="drilldown-header">
            <span className="drilldown-avatar">{myChild.avatar}</span>
            <div className="drilldown-info">
              <h3 className="drilldown-name">{myChild.name}</h3>
              <p className="drilldown-ship">{childShip.emoji} {childShip.name}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="drilldown-stats">
            <div className="drilldown-stat">
              <span className="drilldown-stat__value">{myChild.xp}</span>
              <span className="drilldown-stat__label">mil</span>
            </div>
            <div className="drilldown-stat">
              <span className="drilldown-stat__value">{myChild.coins}</span>
              <span className="drilldown-stat__label">🪙 Koin</span>
            </div>
            <div className="drilldown-stat">
              <span className="drilldown-stat__value">{myChild.streak}</span>
              <span className="drilldown-stat__label">🔥 Streak</span>
            </div>
            <div className="drilldown-stat">
              <span className="drilldown-stat__value">{totalEntries}</span>
              <span className="drilldown-stat__label">📸 Logbook</span>
            </div>
          </div>

          {/* Compass bars */}
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
            </div>

            {logEntries && logEntries.length > 0 && (
              <div className="drilldown-logbook-list">
                <h5 className="drilldown-subsection-title">Riwayat Terbaru</h5>
                {logEntries.slice(0, 10).map((entry) => (
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
      )}

      <Navbar role="parent" />
    </div>
  );
}
