import { useState, useEffect } from "react";
import { useClasses, useCreateClass } from "../../hooks/use-classes";
import { useStudentsByClass, useCreateStudent, useDeleteStudent } from "../../hooks/use-students";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { Users, UserPlus, Copy, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

const AVATARS = ["🧒", "👧", "👦", "🧒🏻", "👧🏻", "👦🏻", "🧑‍🦱", "👩‍🦰", "🧑‍🎓"];

export function CrewPage() {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classId = selectedClassId ?? 0;
  const currentClass = classes?.find((c) => c.id === classId);
  const { data: students, isLoading: studentsLoading } = useStudentsByClass(classId);

  const createStudentMutation = useCreateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const createClassMutation = useCreateClass();

  // Add student modal state
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAvatar, setNewStudentAvatar] = useState(AVATARS[0]);
  const [studentTargetClassId, setStudentTargetClassId] = useState<number>(0);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Add class modal state
  const [addClassModal, setAddClassModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newShipName, setNewShipName] = useState("");
  const [addClassError, setAddClassError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (classId) {
      setStudentTargetClassId(classId);
    }
  }, [classId]);

  const handleCopyCode = () => {
    const code = currentClass?.classCode || currentClass?.class_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenAddStudent = () => {
    setAddStudentError(null);
    setNewStudentName("");
    setStudentTargetClassId(classId);
    setAddStudentModal(true);
  };

  const handleOpenAddClass = () => {
    setAddClassError(null);
    setNewSchoolName("");
    setNewClassCode("");
    setNewShipName("");
    setAddClassModal(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);

    const targetId = studentTargetClassId || classId;
    if (!newStudentName.trim()) {
      setAddStudentError("Harap masukkan nama lengkap siswa");
      return;
    }
    if (!targetId) {
      setAddStudentError("Harap pilih kelas terlebih dahulu. Jika belum ada kelas, buat kelas baru.");
      return;
    }

    try {
      await createStudentMutation.mutateAsync({
        classId: targetId,
        name: newStudentName.trim(),
        avatar: newStudentAvatar,
      });
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setNewStudentName("");
      setAddStudentModal(false);
    } catch (err: any) {
      setAddStudentError(err.message || "Gagal menambahkan siswa");
    }
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    if (window.confirm(`Yakin ingin menghapus siswa ${name}? Data kebiasaan siswa akan terhapus.`)) {
      try {
        await deleteStudentMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || "Gagal menghapus siswa");
      }
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClassError(null);

    if (!newSchoolName.trim() || !newClassCode.trim()) {
      setAddClassError("Nama sekolah dan kode kelas wajib diisi");
      return;
    }

    try {
      const created = await createClassMutation.mutateAsync({
        schoolName: newSchoolName.trim(),
        classCode: newClassCode.trim().toUpperCase(),
        shipName: newShipName.trim() || undefined,
      });
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setSelectedClassId(created.id);
      setStudentTargetClassId(created.id);
      setNewSchoolName("");
      setNewClassCode("");
      setNewShipName("");
      setAddClassModal(false);
    } catch (err: any) {
      setAddClassError(err.message || "Gagal membuat kelas baru");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-600" />
            <span>Manajemen Awak Kapal (Siswa)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar siswa, tambahkan siswa baru, dan bagikan kode akses kelas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {classes && classes.length > 0 && (
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
          )}

          <Button size="sm" variant="outline" onClick={handleOpenAddClass}>
            + Kelas Baru
          </Button>
        </div>
      </div>

      {/* Class Code Announcement Card */}
      {currentClass && (
        <Card className="border-sky-200 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⛵</span>
                <h3 className="font-bold text-sm text-slate-900">
                  {currentClass.schoolName || currentClass.school_name} — Kapal "{currentClass.shipName || currentClass.ship_name || 'Saptara'}"
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Bagikan kode kelas ini kepada siswa dan orang tua untuk masuk ke aplikasi
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-2 border-sky-400 bg-white px-4 py-2 text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  Kode Kelas
                </span>
                <span className="font-display text-xl font-extrabold text-sky-600 tracking-wider">
                  {currentClass.classCode || currentClass.class_code}
                </span>
              </div>
              <Button size="sm" variant="gold" onClick={handleCopyCode} className="gap-1 text-xs">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Tersalin!" : "Salin Kode"}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Students List Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Daftar Siswa Kelas</CardTitle>
            <CardDescription>{students?.length ?? 0} siswa terdaftar dalam pelayaran</CardDescription>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenAddStudent}
            className="gap-1.5 text-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Siswa</span>
          </Button>
        </CardHeader>

        <CardContent>
          {studentsLoading ? (
            <p className="text-center py-8 text-xs text-slate-400">Memuat daftar siswa...</p>
          ) : !students || students.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <span className="text-4xl block mb-2">🧑‍🤝‍🧑</span>
              <p className="text-xs font-semibold">Belum ada siswa di kelas ini.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Klik tombol "+ Tambah Siswa" untuk mendaftarkan siswa pertamamu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-3 px-2 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{student.avatar || "🧒"}</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{student.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>⚡ {student.xp} mil</span>
                        <span>•</span>
                        <span>🔥 Streak {student.streak} hari</span>
                        <span>•</span>
                        <span>🪙 {student.coins} koin</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteStudent(student.id, student.name)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus Siswa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Add Student */}
      <Dialog
        open={addStudentModal}
        onClose={() => setAddStudentModal(false)}
        title="Daftarkan Siswa Baru 🧒"
        description="Masukkan nama siswa untuk didaftarkan ke kelas ini"
      >
        {addStudentError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{addStudentError}</span>
          </div>
        )}

        <form onSubmit={handleAddStudent} className="space-y-4 pt-1">
          {classes && classes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pilih Kelas Tujuan
              </label>
              <select
                value={studentTargetClassId || classId}
                onChange={(e) => setStudentTargetClassId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.schoolName} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap Siswa
            </label>
            <Input
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Contoh: Siti Aisyah"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Pilih Avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setNewStudentAvatar(av)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition-all cursor-pointer ${
                    newStudentAvatar === av
                      ? "bg-sky-500 text-white shadow-md scale-110"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddStudentModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? "Menyimpan..." : "Simpan Siswa"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Add Class */}
      <Dialog
        open={addClassModal}
        onClose={() => setAddClassModal(false)}
        title="Buat Kelas Baru 🏫"
        description="Tambahkan kelas baru yang Anda ampu"
      >
        {addClassError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{addClassError}</span>
          </div>
        )}

        <form onSubmit={handleAddClass} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Sekolah / Kelas
            </label>
            <Input
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              placeholder="Contoh: SDN 1 Merdeka - Kelas 5B"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Kode Unik Kelas (Huruf & Angka)
            </label>
            <Input
              value={newClassCode}
              onChange={(e) => setNewClassCode(e.target.value)}
              placeholder="Contoh: KLS-5B"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Kapal Kelas (Opsional)
            </label>
            <Input
              value={newShipName}
              onChange={(e) => setNewShipName(e.target.value)}
              placeholder="Contoh: KRI Pinisi Nusantara"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddClassModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={createClassMutation.isPending}>
              {createClassMutation.isPending ? "Membuat..." : "Buat Kelas"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
