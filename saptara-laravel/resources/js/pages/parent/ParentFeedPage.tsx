import { useState } from "react";
import { useParentInfo } from "../../hooks/use-auth";
import { useStudentLogbook, useAddParentComment } from "../../hooks/use-logbook";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { formatDateIndo } from "../../lib/utils";
import { HeartHandshake, CheckCircle2, MessageCircle, Sparkles, Send } from "lucide-react";
import confetti from "canvas-confetti";

export function ParentFeedPage() {
  const parentInfo = useParentInfo();
  const studentId = parentInfo?.studentId ?? 0;
  const { data: entries, isLoading } = useStudentLogbook(studentId);
  const commentMutation = useAddParentComment(studentId);

  // Comment dialog state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleOpenComment = (entryId: number) => {
    setActiveEntryId(entryId);
    setCommentText("");
    setCommentModalOpen(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntryId || !commentText.trim()) return;

    try {
      await commentMutation.mutateAsync({ entryId: activeEntryId, comment: commentText.trim() });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setCommentModalOpen(false);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
      {/* Header Greeting */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-500/15">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-3xl border border-white/30">
            {parentInfo?.studentAvatar || "🧒"}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Buku Pantauan {parentInfo?.studentName || "Ananda"} 🌿
            </h1>
            <p className="text-xs text-emerald-100 mt-0.5">
              Lihat kegiatan dan berikan kata-kata penyemangat untuk kebiasaan baik anak di rumah dan sekolah
            </p>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-600" />
              <span>Jurnal Pembiasaan Ananda</span>
            </h2>
            <p className="text-xs text-slate-500">
              Foto dan cerita kegiatan yang diunggah oleh ananda
            </p>
          </div>
          <Badge variant="outline">{entries?.length ?? 0} Kegiatan</Badge>
        </div>

        {isLoading ? (
          <p className="text-center py-10 text-xs text-slate-400">Memuat jurnal...</p>
        ) : !entries || entries.length === 0 ? (
          <Card className="text-center py-12 bg-slate-50/50">
            <span className="text-4xl block mb-2">📸</span>
            <p className="text-sm font-semibold text-slate-700">Belum ada foto jurnal dari ananda</p>
            <p className="text-xs text-slate-400 mt-1">
              Ajak ananda untuk mencatat kegiatan positifnya hari ini!
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden border-slate-200/80 hover:border-emerald-200 transition-all">
                {/* Photo proof */}
                {entry.photoUrl && (
                  <div className="h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={entry.photoUrl}
                      alt={entry.habitName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{entry.habitIcon || "⭐"}</span>
                      <span className="font-bold text-xs text-slate-800">{entry.habitName}</span>
                    </div>
                    {entry.status === "verified" ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Disetujui Guru
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1">
                        Menunggu Guru
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    "{entry.caption}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>📅 {formatDateIndo(entry.date)}</span>
                    <span className="font-semibold text-emerald-600">+{entry.xpEarned} mil</span>
                  </div>

                  {/* Teacher Feedback if any */}
                  {(entry.teacherComment || entry.teacherSticker) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                        <span>👨‍🏫 Komentar Guru:</span>
                        {entry.teacherSticker && <span>{entry.teacherSticker}</span>}
                      </div>
                      {entry.teacherComment && (
                        <p className="mt-1 text-xs italic">{entry.teacherComment}</p>
                      )}
                    </div>
                  )}

                  {/* Parent Feedback */}
                  {entry.parentComment ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-950">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-800">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Catatan Hangat Ayah/Bunda:</span>
                      </div>
                      <p className="mt-1 text-xs italic">"{entry.parentComment}"</p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenComment(entry.id)}
                      className="w-full text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Beri Apresiasi Hangat untuk Ananda</span>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Parent Comment Dialog */}
      <Dialog
        open={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        title="Beri Pesan Kasih Sayang 💖"
        description="Tuliskan ucapan penyemangat atau terima kasih atas kebaikan yang ananda lakukan"
      >
        <form onSubmit={handleSubmitComment} className="space-y-4 pt-2">
          <div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Contoh: Ayah dan Bunda bangga melihatmu bangun pagi dan merapikan tempat tidur sendiri. Pertahankan ya nak!"
              rows={4}
              required
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCommentModalOpen(false)}>
              Batal
            </Button>
            <Button variant="emerald" size="sm" type="submit" disabled={commentMutation.isPending}>
              <Send className="h-3.5 w-3.5" />
              <span>Kirim Pesan</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
