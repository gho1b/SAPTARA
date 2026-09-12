import { useState, useEffect } from "react";
import { useClasses } from "../../hooks/use-classes";
import { usePendingLogbook, useClassLogbook, useVerifyLogbook, useRejectLogbook, useBatchVerifyLogbook } from "../../hooks/use-logbook";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { formatDateIndo } from "../../lib/utils";
import { ClipboardCheck, CheckCircle, XCircle, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

const STICKERS = ["⭐ Hebat!", "🌟 Luar Biasa!", "🏆 Juara!", "🚀 Terus Semangat!", "👏 Bangga Padamu!", "💪 Tangguh!"];

export function FeedPage() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classId = selectedClassId ?? 0;
  const { data: pendingEntries, isLoading: pendingLoading } = usePendingLogbook(classId);
  const { data: allEntries, isLoading: allLoading } = useClassLogbook(classId);

  const verifyMutation = useVerifyLogbook(classId);
  const rejectMutation = useRejectLogbook(classId);
  const batchVerifyMutation = useBatchVerifyLogbook(classId);

  // Modal feedback state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [selectedSticker, setSelectedSticker] = useState<string>(STICKERS[0]);

  // Selected for batch verify
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleQuickVerify = async (entryId: number) => {
    try {
      await verifyMutation.mutateAsync({ entryId, sticker: "⭐ Hebat!" });
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  const handleOpenFeedbackModal = (entryId: number) => {
    setActiveEntryId(entryId);
    setFeedbackComment("");
    setSelectedSticker(STICKERS[0]);
    setFeedbackModalOpen(true);
  };

  const handleCustomVerify = async () => {
    if (!activeEntryId) return;
    try {
      await verifyMutation.mutateAsync({
        entryId: activeEntryId,
        comment: feedbackComment || undefined,
        sticker: selectedSticker,
      });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setFeedbackModalOpen(false);
    } catch {
      // ignore
    }
  };

  const handleReject = async (entryId: number) => {
    const reason = window.prompt("Berikan alasan atau catatan revisi untuk siswa:", "Foto kurang jelas, silakan unggah ulang");
    if (reason !== null) {
      try {
        await rejectMutation.mutateAsync({ entryId, comment: reason });
      } catch {
        // ignore
      }
    }
  };

  const handleBatchVerify = async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchVerifyMutation.mutateAsync({ entryIds: selectedIds, sticker: "⭐ Terverifikasi Guru" });
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setSelectedIds([]);
    } catch {
      // ignore
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-6">
      {/* Header & Class Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-sky-600" />
            <span>Beranda Verifikasi Jurnal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Periksa dan berikan apresiasi pada foto pembiasaan yang dikirim oleh siswa
          </p>
        </div>

        {/* Class selector */}
        {classes && classes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kelas:</span>
            <select
              value={selectedClassId ?? ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.schoolName || c.school_name} ({c.classCode || c.class_code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pending verification section */}
      <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-slate-800">Menunggu Verifikasi</CardTitle>
                <Badge variant="warning">{pendingEntries?.length ?? 0} Perlu Ditinjau</Badge>
              </div>
              <CardDescription>Beri apresiasi atau stiker untuk memotivasi semangat anak</CardDescription>
            </div>

            {selectedIds.length > 0 && (
              <Button
                variant="emerald"
                size="sm"
                onClick={handleBatchVerify}
                disabled={batchVerifyMutation.isPending}
                className="gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Verifikasi {selectedIds.length} Terpilih Sekaligus</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {pendingLoading ? (
            <p className="text-center py-8 text-xs text-slate-400">Memuat antrean jurnal...</p>
          ) : !pendingEntries || pendingEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-3xl block mb-2">🎉</span>
              <p className="text-xs font-semibold">Semua jurnal siswa sudah selesai diverifikasi!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingEntries.map((entry) => {
                const isSelected = selectedIds.includes(entry.id);

                return (
                  <Card
                    key={entry.id}
                    className={`overflow-hidden border transition-all ${
                      isSelected ? "border-sky-400 ring-2 ring-sky-200 bg-sky-50/20" : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(entry.id)}
                          className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="text-lg">{entry.studentAvatar || "🧒"}</span>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{entry.studentName}</p>
                          <p className="text-[10px] text-slate-400">{formatDateIndo(entry.date)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.habitIcon} {entry.habitName}
                      </Badge>
                    </div>

                    {/* Photo proof */}
                    {entry.photoUrl && (
                      <div className="h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={entry.photoUrl}
                          alt="Bukti Siswa"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Caption */}
                    <div className="p-3.5 space-y-3">
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
                        "{entry.caption}"
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="emerald"
                          onClick={() => handleQuickVerify(entry.id)}
                          disabled={verifyMutation.isPending}
                          className="flex-1 text-xs"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Verifikasi</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() => handleOpenFeedbackModal(entry.id)}
                          className="text-xs"
                          title="Beri Stiker & Pesan"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Stiker</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(entry.id)}
                          className="text-xs text-rose-600 hover:bg-rose-50"
                          title="Tolak / Revisi"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal to give sticker and encouragement message */}
      <Dialog
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Beri Apresiasi & Stiker Motivasi 🌟"
        description="Pilih stiker apresiasi dan tuliskan pesan penyemangat untuk siswa"
      >
        <div className="space-y-4 pt-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Pilih Stiker</label>
            <div className="grid grid-cols-3 gap-2">
              {STICKERS.map((stk) => (
                <button
                  key={stk}
                  type="button"
                  onClick={() => setSelectedSticker(stk)}
                  className={`rounded-xl p-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedSticker === stk
                      ? "bg-amber-400 text-amber-950 shadow-md scale-102"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Catatan untuk Siswa (Opsional)
            </label>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Contoh: Sangat bagus Budi! Kebiasaan bangun pagimu sudah sangat teratur."
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setFeedbackModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="sm" onClick={handleCustomVerify} disabled={verifyMutation.isPending}>
              Kirim Apresiasi & Verifikasi ✨
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
