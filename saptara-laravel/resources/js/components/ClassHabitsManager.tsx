import { useState } from "react";
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from "../hooks/use-habits";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Dialog } from "./ui/Dialog";
import { Sparkles, Plus, Trash2, Pencil, ShieldCheck, Star, AlertCircle, Info, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import type { Habit } from "../types";

interface ClassHabitsManagerProps {
  classId: number;
  classCode?: string;
}

const CUSTOM_ICONS = ["📖", "🌿", "🥛", "🧹", "🎨", "🕌", "🧘", "🤝", "🚴", "⭐", "🎵", "🏊"];

export function ClassHabitsManager({ classId, classCode }: ClassHabitsManagerProps) {
  const { data: habits, isLoading } = useHabits(classId);
  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit(classId);
  const deleteHabitMutation = useDeleteHabit(classId);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(CUSTOM_ICONS[0]);
  const [island, setIsland] = useState("Pulau Karakter Mandiri");
  const [error, setError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setName("");
    setDescription("");
    setIcon(CUSTOM_ICONS[0]);
    setIsland("Pulau Karakter Mandiri");
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description || "");
    setIcon(habit.icon || CUSTOM_ICONS[0]);
    setIsland(habit.island || "Pulau Karakter Mandiri");
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama kebiasaan wajib diisi");
      return;
    }

    try {
      if (editingHabit) {
        // Edit Mode
        await updateHabitMutation.mutateAsync({
          id: editingHabit.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            icon,
            island: island.trim() || "Pulau Karakter Mandiri",
          },
        });
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } else {
        // Create Mode
        if (!classId) {
          setError("Pilih kelas terlebih dahulu");
          return;
        }

        await createHabitMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          island: island.trim() || "Pulau Karakter Mandiri",
          class_id: classId,
        });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      setModalOpen(false);
      setEditingHabit(null);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan kebiasaan");
    }
  };

  const handleDelete = async (habit: Habit) => {
    const totalFilled = (habit.completions_count ?? 0) + (habit.logbook_entries_count ?? 0);

    if (totalFilled > 0) {
      alert(
        `Kebiasaan "${habit.name}" sudah pernah diisi oleh siswa (${totalFilled} kali diisi). Untuk menjaga riwayat capaian siswa, kebiasaan ini tidak dapat dihapus. Silakan gunakan tombol edit (pensil) untuk menyesuaikan nama atau deskripsinya.`
      );
      return;
    }

    if (window.confirm(`Yakin ingin menghapus kebiasaan "${habit.name}" dari kelas ini? Kebiasaan ini belum pernah diisi oleh siswa sehingga aman dihapus.`)) {
      try {
        await deleteHabitMutation.mutateAsync(habit.id);
      } catch (err: any) {
        alert(err.message || "Gagal menghapus kebiasaan");
      }
    }
  };

  const globalHabits = habits?.filter((h) => !h.is_custom && !h.isCustom) ?? [];
  const customHabits = habits?.filter((h) => h.is_custom || h.isCustom) ?? [];

  return (
    <>
      <Card className="border-sky-100 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-600" />
              <span>Kebiasaan & Misi Kelas ({classCode || "Kelas Aktif"})</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Kelola 7 kebiasaan pokok Sapta Tara dan kebiasaan khusus yang Anda terapkan pada kelas ini
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs self-start sm:self-center rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Tambah Kebiasaan Kelas</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {isLoading ? (
          <p className="text-center py-6 text-xs text-slate-400">Memuat kebiasaan kelas...</p>
        ) : (
          <>
            {/* Custom habits section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Kebiasaan Khusus Kelas Anda ({customHabits.length})</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Kebiasaan yang belum diisi dapat dihapus. Kebiasaan yang sudah diisi dapat diedit.
                </span>
              </div>

              {customHabits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/40">
                  <span className="text-2xl block mb-1.5">🌟</span>
                  <p className="text-xs font-bold text-slate-700">Belum ada kebiasaan khusus untuk kelas ini</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tambahkan kebiasaan seperti membaca buku 15 menit, merawat tanaman, atau infak subuh.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenCreate}
                    className="mt-3 text-xs text-sky-600 border-sky-300 hover:bg-sky-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Buat Kebiasaan Sekarang
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {customHabits.map((habit) => {
                    const totalFilled = (habit.completions_count ?? 0) + (habit.logbook_entries_count ?? 0);
                    const canDelete = totalFilled === 0;

                    return (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-sky-200 bg-sky-50/40 shadow-xs hover:border-sky-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0">{habit.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{habit.name}</h4>
                              <span className="text-[10px] bg-sky-200/70 text-sky-800 font-semibold px-1.5 py-0.2 rounded shrink-0">
                                Khusus
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{habit.description}</p>
                            
                            {/* Fill status badge */}
                            <div className="mt-1 flex items-center gap-1 text-[10px]">
                              {totalFilled > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                  <Lock className="h-2.5 w-2.5" /> {totalFilled}x diisi oleh siswa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                                  Belum diisi (dapat dihapus)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(habit)}
                            className="text-slate-500 hover:text-sky-600 p-2 rounded-xl hover:bg-sky-100/60 transition-colors"
                            title="Edit kebiasaan"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(habit)}
                              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                              title="Hapus kebiasaan (belum pernah diisi)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(habit)}
                              className="text-slate-300 hover:text-amber-600 p-2 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Sudah pernah diisi siswa (tidak dapat dihapus, gunakan edit)"
                            >
                              <Lock className="h-4 w-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Core 7 habits */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>7 Kebiasaan Pokok Sapta Tara (Standar Nasional)</span>
                </div>
                <span className="text-[11px] text-slate-400">Terlindungi (tidak dapat dihapus)</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {globalHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">{habit.icon}</span>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-700 truncate">{habit.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{habit.description || habit.island}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(habit)}
                        className="text-slate-400 hover:text-sky-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit deskripsi kebiasaan pokok"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200">
                        Pokok
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* Modal Dialog Editor Kebiasaan (Tambah / Edit) */}
    <Dialog
        open={modalOpen}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingHabit(null);
        }}
        title={editingHabit ? "Edit Kebiasaan" : "Tambah Kebiasaan Khusus Kelas"}
        description={
          editingHabit
            ? `Sesuaikan nama, deskripsi, atau simbol ikon untuk kebiasaan "${editingHabit.name}".`
            : "Buat kebiasaan tambahan yang relevan dengan program khusus kelas atau sekolah Anda."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Kebiasaan <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Membaca Buku 15 Menit / Merawat Tanaman"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Membaca buku fiksi atau pengetahuan umum setiap sore"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Ikon Simbol</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {CUSTOM_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`h-10 w-10 text-xl rounded-xl border flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "border-sky-500 bg-sky-50 shadow-xs scale-105 ring-2 ring-sky-300"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pulau Tema</label>
            <Input
              value={island}
              onChange={(e) => setIsland(e.target.value)}
              placeholder="Contoh: Pulau Karakter Mandiri / Pulau Literasi"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingHabit(null);
              }}
              disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              {createHabitMutation.isPending || updateHabitMutation.isPending
                ? "Menyimpan..."
                : editingHabit
                ? "Simpan Perubahan"
                : "Simpan Kebiasaan Baru"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
