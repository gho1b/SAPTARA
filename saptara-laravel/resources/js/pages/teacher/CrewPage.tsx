import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClasses, useCreateClass } from "../../hooks/use-classes";
import { useStudentsByClass, useCreateStudent, useDeleteStudent } from "../../hooks/use-students";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import {
  Users,
  UserPlus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Loader2,
  Sparkles,
  Ship,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadAuthorizedFile } from "../../lib/download";
import { ClassHabitsManager } from "../../components/ClassHabitsManager";
import { ClassMissionManager } from "../../components/ClassMissionManager";

const AVATARS = ["🧒", "👧", "👦", "🧒🏻", "👧🏻", "👦🏻", "🧑‍🦱", "👩‍🦰", "🧑‍🎓"];

export function CrewPage() {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "habits" | "missions">("students");

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
  const [downloading, setDownloading] = useState<string | null>(null);

  // Import modal state
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleExportStudentPdf = async (studentId: number, studentName: string) => {
    try {
      setDownloading(`student-${studentId}`);
      await downloadAuthorizedFile(`/api/reports/student/${studentId}/pdf`, `Raport_SAPTARA_${studentName}.pdf`);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh raport PDF siswa");
    } finally {
      setDownloading(null);
    }
  };

  const handleExportClassPdf = async (targetClassId: number) => {
    try {
      setDownloading(`class-pdf-${targetClassId}`);
      await downloadAuthorizedFile(`/api/reports/class/${targetClassId}/pdf`, `Rekap_Kelas_${targetClassId}.pdf`);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh rekap kelas PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleExportClassExcel = async (targetClassId: number) => {
    try {
      setDownloading(`class-excel-${targetClassId}`);
      await downloadAuthorizedFile(`/api/reports/class/${targetClassId}/excel`, `Rekap_Kelas_${targetClassId}.csv`);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh rekap kelas Excel/CSV");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadAuthorizedFile("/api/students/template", "template_import_siswa_saptara.csv");
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh template");
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Silakan pilih file Excel (.xlsx) atau .csv terlebih dahulu");
      return;
    }
    if (!classId) {
      setImportError("Silakan pilih kelas tujuan terlebih dahulu");
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append("class_id", String(classId));
    formData.append("file", importFile);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengimpor data siswa");
      }

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setImportSuccess(
        `Berhasil mengimpor ${json.imported} siswa! ${
          json.skipped?.length ? `(${json.skipped.length} nama dilewati karena sudah terdaftar)` : ""
        }`
      );
      queryClient.invalidateQueries({ queryKey: ["students", classId] });
      setImportFile(null);
      setTimeout(() => {
        setImportModal(false);
        setImportSuccess(null);
      }, 2500);
    } catch (err: any) {
      setImportError(err.message || "Terjadi kesalahan saat import");
    } finally {
      setImportLoading(false);
    }
  };

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

      {/* Tab Switcher: Awak Siswa vs Kebiasaan Kelas vs Tantangan Kelas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "students"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Awak Siswa ({students?.length ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("habits")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "habits"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Kebiasaan & Misi Kelas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("missions")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "missions"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Ship className="h-4 w-4" />
          <span>Tantangan Kolektif (Class Mission)</span>
        </button>
      </div>

      {activeTab === "missions" ? (
        <ClassMissionManager
          classId={classId}
          classCode={currentClass?.classCode || currentClass?.class_code}
        />
      ) : activeTab === "habits" ? (
        <ClassHabitsManager
          classId={classId}
          classCode={currentClass?.classCode || currentClass?.class_code}
        />
      ) : (
        /* Students List Card */
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Daftar Siswa Kelas</CardTitle>
              <CardDescription>{students?.length ?? 0} siswa terdaftar dalam pelayaran</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportClassExcel(classId)}
                disabled={downloading === `class-excel-${classId}` || !classId}
                className="gap-1 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                title="Ekspor Rekap Karakter ke Excel / CSV"
              >
                {downloading === `class-excel-${classId}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                <span>Rekap Excel</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportClassPdf(classId)}
                disabled={downloading === `class-pdf-${classId}` || !classId}
                className="gap-1 text-xs text-sky-700 border-sky-300 hover:bg-sky-50"
                title="Unduh Rekap Karakter Kelas PDF"
              >
                {downloading === `class-pdf-${classId}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span>Rekap PDF</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setImportModal(true)}
                className="gap-1 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                title="Import Siswa dari file Excel/CSV"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import Excel</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenAddStudent}
                className="gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Siswa</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {studentsLoading ? (
              <p className="text-center py-8 text-xs text-slate-400">Memuat daftar siswa...</p>
            ) : !students || students.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <span className="text-4xl block mb-2">🧑‍🤝‍🧑</span>
                <p className="text-xs font-semibold">Belum ada siswa di kelas ini.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol "+ Siswa" atau "Import Excel" untuk mendaftarkan siswa.
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
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportStudentPdf(student.id, student.name)}
                        disabled={downloading === `student-${student.id}`}
                        className="h-8 gap-1 text-[11px] text-sky-700 border-sky-200 hover:bg-sky-50"
                        title="Cetak Raport Karakter Siswa PDF"
                      >
                        {downloading === `student-${student.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        <span>Raport PDF</span>
                      </Button>

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
      )}

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

      {/* Modal Import Siswa dari Excel / CSV */}
      <Dialog
        open={importModal}
        onClose={() => setImportModal(false)}
        title="Import Data Siswa dari Excel / CSV 📊"
        description="Unggah berkas spreadsheet berisi daftar nama siswa untuk didaftarkan sekaligus ke kelas."
      >
        <div className="space-y-4 pt-1">
          {importError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">1. Unduh Format Template</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-1 h-7 text-xs border-sky-300 text-sky-800 hover:bg-sky-100"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Template (.csv)</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Kolom wajib: <strong>Nama Siswa</strong>. Kolom opsional: <em>Avatar</em> (emoji) dan <em>Email Orang Tua</em>.
            </p>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                2. Pilih File Excel / CSV
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 border border-slate-200 rounded-xl p-1 bg-white"
                required
              />
              {importFile && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  ✓ File terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setImportModal(false)}
                disabled={importLoading}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={importLoading || !importFile}
                className="gap-1.5"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Mulai Import</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
