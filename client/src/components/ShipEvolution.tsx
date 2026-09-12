import { useStudent } from "../hooks/use-students";
import { useStudentAccessories } from "../hooks/use-rewards";
import type { ShipLevel } from "../types";

// Ship levels (static config, mirrors server types)
const SHIP_LEVELS: ShipLevel[] = [
  { level: 1, name: "Rakit Bambu", emoji: "🪵", minXP: 0, maxXP: 100, description: "Pemula — Awal petualanganmu!", ship: "raft" },
  { level: 2, name: "Sampan Dayung", emoji: "🚣", minXP: 100, maxXP: 300, description: "Pejuang — Kamu mulai tangguh!", ship: "rowboat" },
  { level: 3, name: "Kapal Pinisi", emoji: "⛵", minXP: 300, maxXP: 600, description: "Penjelajah Nusantara — Sang Pelaut Agung!", ship: "pinisi" },
  { level: 4, name: "Kapten Saptara", emoji: "🚢", minXP: 600, maxXP: 1000, description: "Legenda Samudra — Penguasa Tujuh Lautan!", ship: "saptara" },
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

/**
 * ShipEvolution Component
 *
 * Displays the student's current ship level with XP progress bar
 * and equipped accessories.
 */
export function ShipEvolution({ studentId }: ShipEvolutionProps) {
  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: accessories, isLoading: accessoriesLoading } = useStudentAccessories(studentId);

  if (studentLoading || accessoriesLoading) {
    return (
      <div className="ship-evolution" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <p style={{ opacity: 0.6 }}>Memuat kapal...</p>
      </div>
    );
  }

  if (!student) return null;

  const level = getShipLevel(student.xp);
  const progress = Math.min(
    ((student.xp - level.minXP) / (level.maxXP - level.minXP)) * 100,
    100
  );

  return (
    <div className="ship-evolution" id="ship-evolution">
      {/* Ship display */}
      <div className="ship-evolution__display">
        <div className="ship-evolution__ship" style={{ fontSize: "80px", animation: "shipBob 3s ease-in-out infinite" }}>
          {level.emoji}
        </div>
        <h3 className="ship-evolution__name">{level.name}</h3>
        <p className="ship-evolution__desc">{level.description}</p>
      </div>

      {/* XP Progress */}
      <div className="ship-evolution__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-bar__label">
          <span>⚡ {student.xp} mil</span>
          <span>🎯 {level.maxXP} mil</span>
        </div>
      </div>

      {/* Level progression */}
      <div className="ship-evolution__levels">
        {SHIP_LEVELS.map((sl) => (
          <div
            key={sl.level}
            className={`ship-level ${sl.level <= level.level ? "unlocked" : "locked"} ${sl.level === level.level ? "current" : ""}`}
          >
            <span className="ship-level__emoji">{sl.emoji}</span>
            <span className="ship-level__name">{sl.name}</span>
          </div>
        ))}
      </div>

      {/* Equipped accessories — only show owned ones */}
      {accessories && accessories.filter((a) => a.owned).length > 0 && (
        <div className="ship-evolution__accessories">
          <h4 className="section-title" style={{ fontSize: "14px", marginBottom: "8px" }}>
            🎨 Aksesoris Terpasang
          </h4>
          <div className="equipped-accessories-grid">
            {accessories.filter((a) => a.owned).map((acc) => (
              <div key={acc.id} className="equipped-accessory-item">
                <span className="equipped-accessory__icon">{acc.icon || "🎁"}</span>
                <span className="equipped-accessory__name">{acc.name || acc.accessoryId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
