import { useState, useEffect } from "react";
import { useClasses } from "../../hooks/use-classes";
import { useStudentsByClass } from "../../hooks/use-students";
import { useHabits } from "../../hooks/use-habits";
import { useAwardBadge, useSendBottleMessage } from "../../hooks/use-rewards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Award, Send, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export function RewardsPage() {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classId = selectedClassId ?? 0;
  const { data: students } = useStudentsByClass(classId);
  const { data: habits } = useHabits();

  const awardBadgeMutation = useAwardBadge();
  const sendMessageMutation = useSendBottleMessage();

  // Award Badge State
  const [badgeStudentId, setBadgeStudentId] = useState<number | null>(null);
  const [badgeHabitId, setBadgeHabitId] = useState<number | null>(null);
  const [badgeSuccess, setBadgeSuccess] = useState(false);

  // Message State
  const [messageStudentId, setMessageStudentId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSticker, setMessageSticker] = useState("⭐");
  const [messageSuccess, setMessageSuccess] = useState(false);

  useEffect(() => {
    if (students && students.length > 0) {
      if (!badgeStudentId) setBadgeStudentId(students[0].id);
      if (!messageStudentId) setMessageStudentId(students[0].id);
    }
    if (habits && habits.length > 0 && !badgeHabitId) {
      setBadgeHabitId(habits[0].id);
    }
  }, [students, habits]);

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeStudentId || !badgeHabitId) return;

    try {
      await awardBadgeMutation.mutateAsync({ studentId: badgeStudentId, habitId: badgeHabitId });
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setBadgeSuccess(true);
      setTimeout(() => setBadgeSuccess(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageStudentId || !messageText.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        studentId: messageStudentId,
        comment: messageText,
        sticker: messageSticker,
      });
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setMessageSuccess(true);
      setMessageText("");
      setTimeout(() => setMessageSuccess(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            <span>Apresiasi, Piagam & Pesan Botol</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sematkan lencana kebiasaan atau kirim surat apresiasi ke kapal siswa
          </p>
        </div>

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Award Badge Form */}
        <Card className="border-amber-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              <div>
                <CardTitle className="text-base text-amber-950">Sematkan Piagam Lencana</CardTitle>
                <CardDescription>Berikan lencana khusus kebiasaan baik untuk siswa teladan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {badgeSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>Piagam penghargaan berhasil disematkan ke profil siswa!</span>
              </div>
            )}

            <form onSubmit={handleAwardBadge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih Siswa
                </label>
                <select
                  value={badgeStudentId ?? ""}
                  onChange={(e) => setBadgeStudentId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {students?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.avatar} {s.name} ({s.xp} mil)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih Lencana Kebiasaan
                </label>
                <select
                  value={badgeHabitId ?? ""}
                  onChange={(e) => setBadgeHabitId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {habits?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon} {h.name} — {h.badge}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                variant="gold"
                disabled={awardBadgeMutation.isPending}
                className="w-full text-xs font-bold"
              >
                <Sparkles className="h-4 w-4" />
                <span>Sematkan Piagam Penghargaan</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Send Bottle Message Form */}
        <Card className="border-sky-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍾</span>
              <div>
                <CardTitle className="text-base text-slate-800">Kirim Pesan dalam Botol</CardTitle>
                <CardDescription>Kirim surat motivasi rahasia langsung ke dek kapal siswa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {messageSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pesan dalam botol berhasil dihanyutkan ke kapal siswa!</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tujuan Siswa
                </label>
                <select
                  value={messageStudentId ?? ""}
                  onChange={(e) => setMessageStudentId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {students?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.avatar} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih Stiker Surat
                </label>
                <div className="flex gap-2">
                  {["⭐", "🏆", "🌟", "⛵", "🐢", "👏"].map((stk) => (
                    <button
                      key={stk}
                      type="button"
                      onClick={() => setMessageSticker(stk)}
                      className={`h-10 w-10 rounded-xl text-xl transition-all cursor-pointer ${
                        messageSticker === stk
                          ? "bg-sky-500 text-white shadow-md scale-110"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      {stk}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Isi Surat Motivasi
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Tuliskan kata-kata penyemangat untuk siswa..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={sendMessageMutation.isPending}
                className="w-full text-xs font-bold"
              >
                <Send className="h-4 w-4" />
                <span>Hanyutkan Pesan Botol 🌊</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
