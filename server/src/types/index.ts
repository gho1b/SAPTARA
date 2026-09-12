import type { Request } from "express";

// ── Ship Levels (static config) ──
export const SHIP_LEVELS = [
  { level: 1, name: "Rakit Bambu", emoji: "🪵", minXP: 0, maxXP: 100, description: "Pemula — Awal petualanganmu!", ship: "raft" },
  { level: 2, name: "Sampan Dayung", emoji: "🚣", minXP: 100, maxXP: 300, description: "Pejuang — Kamu mulai tangguh!", ship: "rowboat" },
  { level: 3, name: "Kapal Pinisi", emoji: "⛵", minXP: 300, maxXP: 600, description: "Penjelajah Nusantara — Sang Pelaut Agung!", ship: "pinisi" },
  { level: 4, name: "Kapten Saptara", emoji: "🚢", minXP: 600, maxXP: 1000, description: "Legenda Samudra — Penguasa Tujuh Lautan!", ship: "saptara" },
];

// ── Ship Accessories (static config) ──
export const SHIP_ACCESSORIES = [
  { id: "flag-merah", name: "Bendera Merah Putih", icon: "🇮🇩", price: 50, type: "flag" },
  { id: "flag-bajak", name: "Bendera Bajak Laut", icon: "🏴‍☠️", price: 30, type: "flag" },
  { id: "layar-biru", name: "Layar Biru Laut", icon: "🔵", price: 40, type: "sail" },
  { id: "layar-emas", name: "Layar Emas", icon: "🟡", price: 80, type: "sail" },
  { id: "meriam", name: "Meriam Konfeti", icon: "🎆", price: 100, type: "weapon" },
  { id: "telescope", name: "Teropong Ajaib", icon: "🔭", price: 60, type: "tool" },
  { id: "anchor-gold", name: "Jangkar Emas", icon: "⚓", price: 120, type: "anchor" },
  { id: "parrot", name: "Burung Nuri Pendamping", icon: "🦜", price: 90, type: "pet" },
];

// ── Helper: Get ship level from XP ──
export function getShipLevel(xp: number) {
  if (xp >= 600) return SHIP_LEVELS[3];
  if (xp >= 300) return SHIP_LEVELS[2];
  if (xp >= 100) return SHIP_LEVELS[1];
  return SHIP_LEVELS[0];
}

// ── Auth types ──
export interface TeacherPayload {
  userId: string;
  teacherId: number;
  role: "teacher";
}

export interface StudentPayload {
  studentId: number;
  classId: number;
  role: "student";
}

export interface ParentPayload {
  studentId: number;
  classId: number;
  studentName: string;
  role: "parent";
}

export interface AuthenticatedRequest extends Request {
  teacher?: TeacherPayload;
  student?: StudentPayload;
  parent?: ParentPayload;
}
