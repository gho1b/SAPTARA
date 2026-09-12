import { useState } from "react";
import { useParentInfo } from "../../hooks/use-auth";
import { useStudentLogbook, useAddParentComment } from "../../hooks/use-logbook";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { formatDateIndo } from "../../lib/utils";
import { HeartHandshake, CheckCircle2, MessageCircle, Sparkles, Send, UserPlus, Users, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { authService } from "../../services/auth.service";
import { useQueryClient } from "@tanstack/react-query";
import { logbookKeys } from "../../hooks/use-logbook";

export function ParentFeedPage() {
  const parentInfo = useParentInfo();
  const studentId = parentInfo?.studentId ?? 0;
  const { data: entries, isLoading } = useStudentLogbook(studentId);
  const commentMutation = useAddParentComment(studentId);
  const queryClient = useQueryClient();

  // Comment dialog state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // Link child dialog state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkChildName, setLinkChildName] = useState("");
  const [linkClassCode, setLinkClassCode] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [switchingChildId, setSwitchingChildId] = useState<number | null>(null);

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

  const handleSwitchChild = async (childId: number) => {
    if (childId === studentId) return;
    try {
      setSwitchingChildId(childId);
      await authService.parentSwitchChild(childId);
      window.dispatchEvent(new Event("parent_info_updated"));
      queryClient.invalidateQueries({ queryKey: logbookKeys.byStudent(childId) });
    } catch (err: any) {
      alert(err.message || "Gagal beralih profil anak");
    } finally {
      setSwitchingChildId(null);
    }
  };

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    if (!linkChildName.trim() || !linkClassCode.trim()) {
      setLinkError("Harap masukkan nama lengkap anak dan kode kelas");
      return;
    }

    try {
      setLinkLoading(true);
      await authService.parentLinkChild(linkChildName.trim(), linkClassCode.trim().toUpperCase());
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      window.dispatchEvent(new Event("parent_info_updated"));
      setLinkChildName("");
      setLinkClassCode("");
      setLinkModalOpen(false);
    } catch (err: any) {
      setLinkError(err.message || "Gagal menghubungkan anak. Pastikan nama dan kode kelas sesuai.");
    } finally {
      setLinkLoading(false);
    }
  };

  const children = parentInfo?.children ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
      {/* Header Greeting */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-500/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          <Button
            size="sm"
            onClick={() => setLinkModalOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-bold gap-1.5 self-start sm:self-center"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Tambah Anak</span>
          </Button>
        </div>
      </div>

      {/* Multi-Child Selector (Phase 15) */}
      {children.length > 0 && (
        <Card className="border-emerald-100/80 bg-emerald-50/40 p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Pilih Anak yang Dipantau:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {children.map((child) => {
                const isActive = child.id === studentId;
                const isSwitching = switchingChildId === child.id;

                return (
                  <button
                    key={child.id}
                    onClick={() => handleSwitchChild(child.id)}
                    disabled={isActive || !!switchingChildId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs scale-105"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    <span>{child.avatar || "🧒"}</span>
                    <span>{child.name}</span>
                    <span className="text-[10px] opacity-75">
                      ({child.className || child.classCode})
                    </span>
                    {isSwitching && <Loader2 className="h-3 w-3 animate-spin" />}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Feed List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-600" />
              <span>Jurnal Pembiasaan {parentInfo?.studentName || "Ananda"}</span>
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
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-900">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-800">
                        <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Komentar Ayah / Ibu:</span>
                      </div>
                      <p className="mt-1 text-xs">{entry.parentComment}</p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenComment(entry.id)}
                      className="w-full text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      Beri Kata Penyemangat
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Beri Komentar */}
      <Dialog
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        title="Beri Kata Penyemangat untuk Ananda 🌿"
        description="Dukungan dan apresiasi dari orang tua adalah motivasi terbesar untuk pembentukan karakter anak."
      >
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pesan / Komentar Anda
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Contoh: Hebat sekali nak! Terus pertahankan ya sayang, Ayah dan Ibu bangga."
              rows={4}
              required
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommentModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={commentMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {commentMutation.isPending ? "Mengirim..." : "Kirim Penyemangat"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Hubungkan Anak Tambahan */}
      <Dialog
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Hubungkan Profil Anak Lain 🧒"
        description="Masukkan nama lengkap dan kode akses kelas anak Anda untuk dipantau dalam satu akun orang tua."
      >
        <form onSubmit={handleLinkChild} className="space-y-4">
          {linkError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {linkError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Anak (Siswa) <span className="text-red-500">*</span>
            </label>
            <Input
              value={linkChildName}
              onChange={(e) => setLinkChildName(e.target.value)}
              placeholder="Sesuai nama yang didaftarkan guru di kelas"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kode Kelas Anak <span className="text-red-500">*</span>
            </label>
            <Input
              value={linkClassCode}
              onChange={(e) => setLinkClassCode(e.target.value)}
              placeholder="Contoh: KLS-7A"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkModalOpen(false)}
              disabled={linkLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={linkLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {linkLoading ? "Menghubungkan..." : "Hubungkan Anak"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
