import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { Camera, Upload, CheckCircle2, Clock, AlertCircle, Sparkles, MessageCircle } from "lucide-react";
import { useHabits } from "../hooks/use-habits";
import { useStudentLogbook, useSubmitLogbook } from "../hooks/use-logbook";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { formatDateIndo } from "../lib/utils";

interface PhotoLogbookProps {
  studentId: number;
}

export function PhotoLogbook({ studentId }: PhotoLogbookProps) {
  const [searchParams] = useSearchParams();
  const preselectedHabitId = searchParams.get("habitId");

  const { data: habits } = useHabits();
  const { data: entries, isLoading: entriesLoading } = useStudentLogbook(studentId);
  const submitMutation = useSubmitLogbook(studentId);

  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedHabitId) {
      setSelectedHabitId(Number(preselectedHabitId));
    } else if (habits && habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [preselectedHabitId, habits]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabitId) {
      setFeedbackMsg({ type: "error", text: "Silakan pilih salah satu dari 7 kebiasaan." });
      return;
    }
    if (!caption.trim()) {
      setFeedbackMsg({ type: "error", text: "Tuliskan cerita singkat atau refleksi kebiasaanmu." });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        habitId: selectedHabitId,
        caption,
        photo: photoFile || undefined,
      });

      // Launch joyful celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0ea5e9", "#f59e0b", "#10b981", "#ec4899"],
      });

      setFeedbackMsg({ type: "success", text: "Jurnal berhasil dikirim! Menunggu verifikasi guru." });
      setCaption("");
      clearPhoto();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Gagal mengirim jurnal." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload / Form Card */}
      <Card className="border-sky-100 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xl">📸</span>
            <div>
              <CardTitle className="font-display text-sky-900">Catat Jurnal Kebiasaan</CardTitle>
              <CardDescription>Unggah foto dan ceritakan kegiatan positif yang kamu lakukan hari ini</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {feedbackMsg && (
            <div
              className={`mb-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {feedbackMsg.type === "success" ? <Sparkles className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Habit selector chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Kebiasaan (7 Kebiasaan Anak Indonesia Hebat)
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {habits?.map((habit) => {
                  const isSelected = selectedHabitId === habit.id;
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => setSelectedHabitId(habit.id)}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-500 text-white shadow-md shadow-sky-500/20 scale-102"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <span className="text-xl">{habit.icon}</span>
                      <span className="line-clamp-1">{habit.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo upload field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Foto Bukti Kegiatan (Opsional tapi disarankan)
              </label>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-w-sm mx-auto group">
                  <img src={photoPreview} alt="Preview" className="h-48 w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 rounded-full bg-rose-500 p-1.5 text-white shadow-md hover:bg-rose-600 transition-colors"
                    title="Hapus foto"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-sky-50/50 hover:border-sky-300 transition-all cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600 mb-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Klik untuk ambil foto atau pilih gambar</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format JPG, PNG (maksimal 5MB)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Reflection caption */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Refleksi / Cerita Singkat
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Contoh: Hari ini saya bangun jam 05.00 pagi, sholat subuh, dan merapikan tempat tidur sendiri..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                variant="gold"
                size="lg"
                className="w-full sm:w-auto"
              >
                {submitMutation.isPending ? "Mengirim Jurnal..." : "✨ Kirim Jurnal Kebiasaan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History Logbook Entries */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800">Riwayat Jurnal Foto</h3>
            <p className="text-xs text-slate-500">Semua catatan dan verifikasi dari guru serta orang tua</p>
          </div>
          <Badge variant="outline">{entries?.length ?? 0} Catatan</Badge>
        </div>

        {entriesLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Memuat riwayat...</p>
        ) : !entries || entries.length === 0 ? (
          <Card className="text-center py-10 bg-slate-50/50">
            <span className="text-4xl block mb-2">📖</span>
            <p className="text-sm font-semibold text-slate-700">Belum ada jurnal yang tercatat</p>
            <p className="text-xs text-slate-400 mt-1">Yuk mulai unggah kegiatan pertamamu hari ini!</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden border-slate-200/80 hover:border-sky-200 transition-all">
                {/* Photo if present */}
                {entry.photoUrl && (
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={entry.photoUrl}
                      alt={entry.habitName || "Foto Jurnal"}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{entry.habitIcon || "⭐"}</span>
                      <span className="font-bold text-xs text-slate-800">{entry.habitName}</span>
                    </div>
                    {/* Status Badge */}
                    {entry.status === "verified" && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                      </Badge>
                    )}
                    {entry.status === "pending" && (
                      <Badge variant="warning" className="gap-1">
                        <Clock className="h-3 w-3" /> Menunggu Guru
                      </Badge>
                    )}
                    {entry.status === "rejected" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Perlu Revisi
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                    "{entry.caption}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>📅 {formatDateIndo(entry.date)}</span>
                    <span className="font-semibold text-sky-600">+{entry.xpEarned} mil</span>
                  </div>

                  {/* Teacher Feedback / Sticker */}
                  {(entry.teacherComment || entry.teacherSticker) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                        <span>👨‍🏫 Komentar Guru:</span>
                        {entry.teacherSticker && <span className="text-lg">{entry.teacherSticker}</span>}
                      </div>
                      {entry.teacherComment && (
                        <p className="mt-1 text-xs italic">{entry.teacherComment}</p>
                      )}
                    </div>
                  )}

                  {/* Parent Feedback */}
                  {entry.parentComment && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs text-emerald-900">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-800">
                        <MessageCircle className="h-3 w-3" />
                        <span>Pesan Hangat Orang Tua:</span>
                      </div>
                      <p className="mt-1 text-xs italic">{entry.parentComment}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
