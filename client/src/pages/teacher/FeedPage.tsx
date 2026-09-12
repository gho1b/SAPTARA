import { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { useClasses } from "../../hooks/use-classes";
import { useClassLogbook, usePendingLogbook, useVerifyLogbook, useRejectLogbook, useBatchVerify } from "../../hooks/use-logbook";

/**
 * Teacher Feed Page
 *
 * Shows all logbook entries submitted by students in the teacher's classes.
 * Teacher can verify, reject, or batch-approve entries.
 */
export function FeedPage() {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "pending">("pending");
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  // Use first class if none selected
  const activeClassId = selectedClassId || classes?.[0]?.id || 0;

  const { data: allEntries, isLoading: allLoading } = useClassLogbook(activeClassId);
  const { data: pendingEntries, isLoading: pendingLoading } = usePendingLogbook(activeClassId);
  const verifyLogbook = useVerifyLogbook(activeClassId);
  const rejectLogbook = useRejectLogbook(activeClassId);
  const batchVerify = useBatchVerify(activeClassId);

  const entries = filter === "pending" ? pendingEntries : allEntries;
  const isLoading = filter === "pending" ? pendingLoading : allLoading;

  const handleVerify = (entryId: number) => {
    verifyLogbook.mutate({ entryId, payload: { sticker: "💎", comment: "Bagus, Kapten!" } });
  };

  const handleRejectStart = (entryId: number) => {
    setRejectingId(entryId);
    setRejectComment("");
  };

  const handleRejectConfirm = () => {
    if (rejectingId === null) return;
    rejectLogbook.mutate(
      { entryId: rejectingId, comment: rejectComment || "Coba lagi ya, Kapten!" },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectComment("");
        },
      }
    );
  };

  const handleRejectCancel = () => {
    setRejectingId(null);
    setRejectComment("");
  };

  const handleBatchVerify = () => {
    if (selectedEntries.size === 0) return;
    batchVerify.mutate({
      entryIds: Array.from(selectedEntries),
      sticker: "🪙",
      comment: "Bagus, Kapten!",
    });
    setSelectedEntries(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusEmoji = (status: string) => {
    switch (status) {
      case "verified": return "✅";
      case "pending": return "⏳";
      case "rejected":
      case "needs_revision": return "🔄";
      default: return "❓";
    }
  };

  return (
    <div className="teacher-page" id="teacher-feed-page">
      <div className="page-header">
        <h1 className="page-title">📋 Feed Verifikasi</h1>
        <p className="page-subtitle">Pantau dan setujui misi para kapten cilik</p>
      </div>

      {/* Class selector */}
      <div className="feed-controls">
        <select
          className="class-selector"
          value={activeClassId}
          onChange={(e) => setSelectedClassId(Number(e.target.value))}
          id="feed-class-select"
        >
          {classes?.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.shipName} — {cls.classCode}
            </option>
          ))}
        </select>

        <div className="feed-filter-tabs">
          <button
            className={`tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
            type="button"
          >
            ⏳ Menunggu
          </button>
          <button
            className={`tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            type="button"
          >
            📋 Semua
          </button>
        </div>
      </div>

      {/* Batch actions */}
      {filter === "pending" && selectedEntries.size > 0 && (
        <div className="batch-actions">
          <span>{selectedEntries.size} dipilih</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleBatchVerify}
            disabled={batchVerify.isPending}
            type="button"
          >
            {batchVerify.isPending ? "Memproses..." : `✅ Setujui ${selectedEntries.size} entri`}
          </button>
        </div>
      )}

      {/* Entries */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 32, opacity: 0.6 }}>
          <p>Memuat entri...</p>
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="feed-empty" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: 48 }}>🎉</p>
          <p>{filter === "pending" ? "Semua entri sudah diverifikasi!" : "Belum ada entri logbook."}</p>
        </div>
      ) : (
        <div className="feed-entries">
          {entries.map((entry) => (
            <div key={entry.id} className={`feed-entry status-${entry.status}`}>
              {filter === "pending" && entry.status === "pending" && (
                <input
                  type="checkbox"
                  checked={selectedEntries.has(entry.id)}
                  onChange={() => toggleSelect(entry.id)}
                  className="feed-entry__checkbox"
                />
              )}

              <div className="feed-entry__header">
                <span className="feed-entry__student">
                  {entry.studentAvatar || "🧒"} {entry.studentName || `Murid #${entry.studentId}`}
                </span>
                <span className="feed-entry__habit">
                  {entry.habitIcon || "📋"} {entry.habitName || `Misi #${entry.habitId}`}
                </span>
                <span className={`feed-entry__status badge-${entry.status}`}>
                  {statusEmoji(entry.status)}
                </span>
              </div>

              {entry.photoUrl && (
                <img
                  src={entry.photoUrl}
                  alt="Bukti misi"
                  className="feed-entry__photo"
                  loading="lazy"
                />
              )}

              <p className="feed-entry__caption">{entry.caption}</p>

              <div className="feed-entry__meta">
                <span>📅 {entry.date}</span>
                <span>🕐 {entry.time}</span>
              </div>

              {/* Action buttons for pending entries */}
              {entry.status === "pending" && rejectingId !== entry.id && (
                <div className="feed-entry__actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleVerify(entry.id)}
                    disabled={verifyLogbook.isPending}
                    type="button"
                  >
                    ✅ Setujui
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRejectStart(entry.id)}
                    type="button"
                  >
                    🔄 Tolak
                  </button>
                </div>
              )}

              {/* Inline reject form */}
              {rejectingId === entry.id && (
                <div className="feed-entry__reject-form">
                  <textarea
                    className="reject-textarea"
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Alasan penolakan (opsional)..."
                    rows={2}
                  />
                  <div className="reject-form-actions">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleRejectConfirm}
                      disabled={rejectLogbook.isPending}
                      type="button"
                    >
                      {rejectLogbook.isPending ? "Mengirim..." : "🔄 Konfirmasi Tolak"}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleRejectCancel}
                      type="button"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {entry.teacherComment && (
                <div className="feed-entry__feedback">
                  <span>{entry.teacherSticker || "💬"}</span>
                  <span>{entry.teacherComment}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Navbar role="teacher" />
    </div>
  );
}
