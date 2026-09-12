import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { useParentInfo, useParentLogout } from "../../hooks/use-auth";
import { apiParentFetch } from "../../lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LogbookEntry } from "../../types";

/**
 * Parent Feed Page (Read-Only + Komentar)
 *
 * Orang tua bisa melihat semua logbook siswa di kelas dan
 * memberikan komentar pada setiap tugas tanpa bisa verifikasi/tolak.
 */
export function ParentFeedPage() {
  const navigate = useNavigate();
  const parentInfo = useParentInfo();
  const { logout } = useParentLogout();
  const classId = parentInfo?.classId ?? 0;
  const [filter, setFilter] = useState<"all" | "pending">("all");
  // Map: entryId → draft komentar
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  // Set entri yang sedang membuka form komentar
  const [openComment, setOpenComment] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: allEntries, isLoading: allLoading } = useQuery({
    queryKey: ["parent-logbook-all", classId],
    queryFn: () => apiParentFetch<LogbookEntry[]>(`/api/logbook/class/${classId}`),
    enabled: !!classId,
  });

  const { data: pendingEntries, isLoading: pendingLoading } = useQuery({
    queryKey: ["parent-logbook-pending", classId],
    queryFn: () => apiParentFetch<LogbookEntry[]>(`/api/logbook/pending/${classId}`),
    enabled: !!classId,
  });

  // Mutation: kirim komentar orang tua
  const submitComment = useMutation({
    mutationFn: ({ entryId, comment }: { entryId: number; comment: string }) =>
      apiParentFetch(`/api/logbook/${entryId}/parent-comment`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-logbook-all", classId] });
      queryClient.invalidateQueries({ queryKey: ["parent-logbook-pending", classId] });
      setOpenComment(null);
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const entries = filter === "pending" ? pendingEntries : allEntries;
  const isLoading = filter === "pending" ? pendingLoading : allLoading;

  const statusEmoji = (status: string) => {
    switch (status) {
      case "verified": return "✅";
      case "pending": return "⏳";
      case "rejected":
      case "needs_revision": return "🔄";
      default: return "❓";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "verified": return "Disetujui";
      case "pending": return "Menunggu";
      case "needs_revision": return "Perlu Perbaikan";
      case "rejected": return "Ditolak";
      default: return status;
    }
  };

  const handleSendComment = (entryId: number) => {
    const comment = commentDrafts[entryId]?.trim();
    if (!comment) return;
    submitComment.mutate({ entryId, comment });
  };

  return (
    <div className="teacher-page" id="parent-feed-page">
      {/* Header dengan tombol logout */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div>
            <h1 className="page-title">📋 Laporan Misi</h1>
            <p className="page-subtitle">
              Aktivitas kelas {parentInfo?.studentName ?? "anak"}
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

      {/* Filter tabs */}
      <div className="feed-controls">
        <div className="feed-filter-tabs">
          <button
            className={`tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            type="button"
          >
            📋 Semua
          </button>
          <button
            className={`tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
            type="button"
          >
            ⏳ Menunggu
          </button>
        </div>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 32, opacity: 0.6 }}>
          <p>Memuat laporan...</p>
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="feed-empty" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: 48 }}>🎉</p>
          <p>{filter === "pending" ? "Tidak ada misi yang menunggu." : "Belum ada misi yang dikerjakan."}</p>
        </div>
      ) : (
        <div className="feed-entries">
          {entries.map((entry) => (
            <div key={entry.id} className={`feed-entry status-${entry.status}`}>
              <div className="feed-entry__header">
                <span className="feed-entry__student">
                  {entry.studentAvatar || "🧒"} {entry.studentName || `Murid #${entry.studentId}`}
                </span>
                <span className="feed-entry__habit">
                  {entry.habitIcon || "📋"} {entry.habitName || `Misi #${entry.habitId}`}
                </span>
                <span className={`feed-entry__status badge-${entry.status}`}>
                  {statusEmoji(entry.status)} {statusLabel(entry.status)}
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

              {/* Komentar guru */}
              {entry.teacherComment && (
                <div className="feed-entry__feedback">
                  <span>{entry.teacherSticker || "💬"}</span>
                  <span>{entry.teacherComment}</span>
                </div>
              )}

              {/* Komentar orang tua — sudah ada */}
              {entry.parentComment && openComment !== entry.id && (
                <div className="feed-entry__parent-comment">
                  <span className="parent-comment__label">👨‍👩‍👦 Komentar Anda:</span>
                  <p className="parent-comment__text">{entry.parentComment}</p>
                  <button
                    className="btn-edit-comment"
                    onClick={() => {
                      setOpenComment(entry.id);
                      setCommentDrafts((d) => ({ ...d, [entry.id]: entry.parentComment ?? "" }));
                    }}
                    type="button"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}

              {/* Form komentar orang tua */}
              {openComment === entry.id ? (
                <div className="feed-entry__comment-form">
                  <textarea
                    className="parent-comment-textarea"
                    value={commentDrafts[entry.id] ?? ""}
                    onChange={(e) =>
                      setCommentDrafts((d) => ({ ...d, [entry.id]: e.target.value }))
                    }
                    placeholder="Tulis komentar untuk anak Anda..."
                    rows={3}
                    maxLength={300}
                  />
                  <div className="parent-comment-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSendComment(entry.id)}
                      disabled={
                        submitComment.isPending ||
                        !commentDrafts[entry.id]?.trim()
                      }
                      type="button"
                    >
                      {submitComment.isPending ? "Mengirim..." : "💬 Kirim Komentar"}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setOpenComment(null)}
                      type="button"
                    >
                      Batal
                    </button>
                  </div>
                  {submitComment.isError && (
                    <p className="error-text">❌ Gagal mengirim komentar</p>
                  )}
                </div>
              ) : !entry.parentComment ? (
                <button
                  className="btn-add-comment"
                  onClick={() => setOpenComment(entry.id)}
                  type="button"
                >
                  💬 Beri Komentar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Navbar role="parent" />
    </div>
  );
}
