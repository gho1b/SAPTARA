import { useState } from "react";
import { useClassMissions, useCreateClassMission } from "../hooks/use-missions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Dialog } from "./ui/Dialog";
import { Ship, Plus, Clock, Users, Sparkles, Coins, CheckCircle2, AlertCircle, Compass } from "lucide-react";
import confetti from "canvas-confetti";

interface ClassMissionManagerProps {
  classId: number;
  classCode?: string;
}

export function ClassMissionManager({ classId, classCode }: ClassMissionManagerProps) {
  const { data: missions, isLoading } = useClassMissions(classId);
  const createMutation = useCreateClassMission(classId);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"total_habits" | "photo_logbooks">("total_habits");
  const [targetCount, setTargetCount] = useState(100);
  const [rewardXp, setRewardXp] = useState(50);
  const [rewardCoins, setRewardCoins] = useState(25);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = (tmpl: "habits_100" | "photo_25" | "habits_250") => {
    const now = new Date();
    if (tmpl === "habits_100") {
      setTitle("Ekspedisi Samudra 100 Kebiasaan");
      setDescription("Seluruh awak kapal mengumpulkan 100 ceklist kebiasaan baik bersama-sama minggu ini!");
      setType("total_habits");
      setTargetCount(100);
      setRewardXp(50);
      setRewardCoins(25);
      now.setDate(now.getDate() + 7);
    } else if (tmpl === "photo_25") {
      setTitle("Galeri Bahari 25 Foto Jurnal");
      setDescription("Unggah dan abadikan 25 foto bukti kebiasaan baik anak bersama keluarga!");
      setType("photo_logbooks");
      setTargetCount(25);
      setRewardXp(75);
      setRewardCoins(35);
      now.setDate(now.getDate() + 7);
    } else if (tmpl === "habits_250") {
      setTitle("Penjelajahan Akbar 250 Kebiasaan");
      setDescription("Tantangan besar dua pekan untuk mengukuhkan kekompakan awak kapal kelas!");
      setType("total_habits");
      setTargetCount(250);
      setRewardXp(120);
      setRewardCoins(60);
      now.setDate(now.getDate() + 14);
    }
    setEndDate(now.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul tantangan wajib diisi");
      return;
    }
    if (targetCount < 10) {
      setError("Target minimal adalah 10");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        target_count: targetCount,
        reward_xp_each: rewardXp,
        reward_coins_each: rewardCoins,
        end_date: endDate,
      });

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Gagal meluncurkan tantangan kelas");
    }
  };

  return (
    <>
      <Card className="border-sky-100 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 via-white to-blue-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
              <Ship className="h-5 w-5 text-sky-600" />
              <span>Tantangan Kolektif Kelas (Class Mission)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ajak seluruh siswa bekerja sama mencapai target bersama untuk membangun gotong royong dan kekompakan
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => {
              applyTemplate("habits_100");
              setModalOpen(true);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs self-start sm:self-center rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Luncurkan Tantangan Baru</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <p className="text-center py-8 text-xs text-slate-400">Memuat tantangan kelas...</p>
        ) : !missions || missions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <span className="text-3xl block mb-2">⛵</span>
            <p className="text-xs font-bold text-slate-700">Belum ada tantangan aktif di kelas ini</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Luncurkan tantangan seperti "100 Kebiasaan Bersama" agar siswa termotivasi saling mengingatkan kebiasaan baik setiap hari.
            </p>
            <Button
              size="sm"
              onClick={() => {
                applyTemplate("habits_100");
                setModalOpen(true);
              }}
              className="mt-3 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Luncurkan Sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 p-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⛵</span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-800">
                        {mission.title}
                      </h4>
                      <p className="text-xs text-slate-500">{mission.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Badge variant={mission.completed ? "success" : "outline"} className="text-[10px]">
                      {mission.completed ? "Target Selesai 🏆" : "Sedang Berlangsung ⛵"}
                    </Badge>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      <span>{mission.days_left} hari tersisa</span>
                    </div>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-sky-600" />
                      <span>Akumulasi Siswa: {mission.current_progress} dari {mission.target_count}</span>
                    </span>
                    <span className="text-sky-700 font-extrabold">{mission.percentage}%</span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mission.completed
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-sky-400 to-blue-600"
                      }`}
                      style={{ width: `${mission.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Rewards and timeline */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Hadiah untuk Tiap Siswa:</span>
                    <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-bold">
                      <Sparkles className="h-3 w-3 text-sky-500" />
                      +{mission.reward_xp_each} XP
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                      <Coins className="h-3 w-3 text-amber-500" />
                      +{mission.reward_coins_each} Koin
                    </span>
                  </div>

                  <div>
                    <span>Periode: {mission.start_date} s/d {mission.end_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Modal Luncurkan Tantangan Baru */}
    <Dialog
        open={modalOpen}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Luncurkan Tantangan Kolektif Kelas ⛵"
        description="Pilih template cepat atau atur target kebiasaan bersama yang ingin dicapai siswa kelas."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Template Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Pilihan Template Cepat
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyTemplate("habits_100")}
                className="p-2 text-left rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 transition-all text-xs"
              >
                <span className="font-bold text-sky-900 block">🌊 100 Kebiasaan</span>
                <span className="text-[10px] text-slate-500">1 Minggu (7 hari)</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("photo_25")}
                className="p-2 text-left rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-xs"
              >
                <span className="font-bold text-amber-900 block">📸 25 Foto Jurnal</span>
                <span className="text-[10px] text-slate-500">1 Minggu (7 hari)</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("habits_250")}
                className="p-2 text-left rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-xs"
              >
                <span className="font-bold text-emerald-900 block">🏆 250 Kebiasaan</span>
                <span className="text-[10px] text-slate-500">2 Minggu (14 hari)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Tantangan <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Ekspedisi Samudra 100 Kebiasaan"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi & Pesan Semangat</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pesan untuk memotivasi seluruh siswa bekerja sama"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Tantangan</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
              >
                <option value="total_habits">Semua Checklist Kebiasaan</option>
                <option value="photo_logbooks">Foto Jurnal Logbook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Jumlah</label>
              <Input
                type="number"
                min={10}
                max={5000}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bonus XP</label>
              <Input
                type="number"
                min={10}
                value={rewardXp}
                onChange={(e) => setRewardXp(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Koin</label>
              <Input
                type="number"
                min={5}
                value={rewardCoins}
                onChange={(e) => setRewardCoins(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Selesai</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              {createMutation.isPending ? "Meluncurkan..." : "Luncurkan Tantangan Kelas ⛵"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
