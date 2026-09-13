import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClasses, useCreateClass } from "../../hooks/use-classes";
import { useStudentsByClass, useCreateStudent, useDeleteStudent, useResetStudentCode } from "../../hooks/use-students";
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
  KeyRound,
  Eye,
  EyeOff,
  Printer,
  RefreshCw,
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
  const resetStudentCodeMutation = useResetStudentCode();
  const createClassMutation = useCreateClass();

  // Add student modal state
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentNis, setNewStudentNis] = useState("");
  const [newStudentAccessCode, setNewStudentAccessCode] = useState("");
  const [newStudentAvatar, setNewStudentAvatar] = useState(AVATARS[0]);
  const [studentTargetClassId, setStudentTargetClassId] = useState<number>(0);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Student PIN visibility state
  const [visibleCodes, setVisibleCodes] = useState<Record<number, boolean>>({});
  const toggleCodeVisibility = (studentId: number) => {
    setVisibleCodes((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  // Student Card Printing state
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardTargetStudent, setCardTargetStudent] = useState<any | null>(null);

  const handleOpenCard = (student: any | null = null) => {
    setCardTargetStudent(student);
    setCardModalOpen(true);
  };

  const handleResetCode = async (studentId: number, studentName: string) => {
    if (window.confirm(`Reset PIN akses untuk ${studentName}? PIN baru 6-digit acak akan dibuat.`)) {
      try {
        const res = await resetStudentCodeMutation.mutateAsync({ id: studentId });
        alert(`Berhasil! Kode PIN baru untuk ${studentName} adalah: ${res.access_code}`);
      } catch (err: any) {
        alert(err.message || "Gagal mereset PIN siswa");
      }
    }
  };

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
    setNewStudentNis("");
    setNewStudentAccessCode("");
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
        nis: newStudentNis.trim() || undefined,
        accessCode: newStudentAccessCode.trim() || undefined,
      });
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setNewStudentName("");
      setNewStudentNis("");
      setNewStudentAccessCode("");
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
                onClick={() => handleOpenCard(null)}
                disabled={!students || students.length === 0}
                className="gap-1 text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                title="Cetak Kartu Akses Seluruh Siswa di Kelas Ini"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Kartu Kelas</span>
              </Button>

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
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-2 hover:bg-slate-50/70 rounded-xl transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{student.avatar || "🧒"}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-800">{student.name}</h4>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            NIS: {student.nis || "-"}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70">
                            <KeyRound className="h-2.5 w-2.5 text-amber-600 inline" />
                            <span>PIN:</span>
                            <span className="font-bold tracking-wider">
                              {visibleCodes[student.id]
                                ? (student.access_code || student.accessCode || "------")
                                : "••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCodeVisibility(student.id)}
                              className="text-slate-400 hover:text-slate-700 ml-0.5 cursor-pointer"
                              title={visibleCodes[student.id] ? "Sembunyikan PIN" : "Lihat PIN"}
                            >
                              {visibleCodes[student.id] ? (
                                <EyeOff className="h-3 w-3 inline" />
                              ) : (
                                <Eye className="h-3 w-3 inline" />
                              )}
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>⚡ {student.xp} mil</span>
                          <span>•</span>
                          <span>🔥 Streak {student.streak} hari</span>
                          <span>•</span>
                          <span>🪙 {student.coins} koin</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCard(student)}
                        className="h-8 gap-1 text-[11px] text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        title="Lihat & Cetak Kartu Akses Siswa"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Kartu</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetCode(student.id, student.name)}
                        className="h-8 gap-1 text-[11px] text-amber-700 border-amber-200 hover:bg-amber-50"
                        title="Reset PIN Siswa ke 6 Digit Baru"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reset PIN</span>
                      </Button>

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
                        <span>Raport</span>
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NIS <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              <Input
                value={newStudentNis}
                onChange={(e) => setNewStudentNis(e.target.value)}
                placeholder="Buat otomatis jika kosong"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kode PIN <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              <Input
                value={newStudentAccessCode}
                onChange={(e) => setNewStudentAccessCode(e.target.value)}
                placeholder="Acak 6-digit jika kosong"
                maxLength={20}
                className="font-mono"
              />
            </div>
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

      {/* Modal Cetak Kartu Akses Siswa */}
      <Dialog
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        title="Kartu Akses Siswa SAPTARA 🖨️"
        description={
          cardTargetStudent
            ? `Kartu akses untuk ${cardTargetStudent.name}`
            : `Menampilkan seluruh kartu akses siswa di kelas ini (${students?.length ?? 0} siswa)`
        }
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <div className="text-xs text-indigo-900">
              <span className="font-bold block">Petunjuk Cetak:</span>
              <span>
                Klik tombol di samping untuk mencetak kartu. Kartu ini dapat digunting dan dibagikan kepada siswa dan wali murid.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCardModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Print</span>
              </Button>
            </div>
          </div>

          {/* Printable Container */}
          <div
            id="printable-student-cards"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1"
          >
            {(cardTargetStudent ? [cardTargetStudent] : (students || [])).map((st: any) => (
              <div
                key={st.id}
                className="border-2 border-dashed border-sky-300 rounded-2xl p-4 bg-gradient-to-br from-sky-50/60 via-white to-amber-50/40 shadow-xs relative overflow-hidden flex flex-col justify-between"
              >
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-sky-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⛵</span>
                    <div>
                      <h4 className="font-display font-extrabold text-xs text-sky-900 leading-tight">
                        {currentClass?.schoolName || currentClass?.school_name || "SAPTARA"}
                      </h4>
                      <p className="text-[10px] font-semibold text-sky-600">
                        Kelas: {currentClass?.classCode || currentClass?.class_code}
                        {currentClass?.shipName || currentClass?.ship_name
                          ? ` • Kapal ${currentClass.shipName || currentClass.ship_name}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Kartu Akses
                  </span>
                </div>

                {/* Body Card */}
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="h-12 w-12 rounded-2xl bg-sky-100 flex items-center justify-center text-3xl shrink-0 border border-sky-200 shadow-xs">
                    {st.avatar || "🧒"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-sm text-slate-900 truncate">{st.name}</h5>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">NIS</span>
                        <span className="font-mono text-xs font-bold text-sky-800">
                          {st.nis || "-"}
                        </span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-center">
                        <span className="text-[9px] font-bold text-amber-700 uppercase block">PIN AKSES</span>
                        <span className="font-mono text-sm font-extrabold text-amber-900 tracking-wider">
                          {st.access_code || st.accessCode || "------"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="border-t border-slate-100 pt-2 text-[9px] text-slate-400 text-center flex items-center justify-between">
                  <span>🌐 Masuk di saptara.id</span>
                  <span>🔒 Simpan PIN dengan aman</span>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-student-cards, #printable-student-cards * {
                visibility: visible;
              }
              #printable-student-cards {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                max-height: none !important;
                overflow: visible !important;
                padding: 1cm;
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 1.5rem !important;
              }
            }
          `}</style>
        </div>
      </Dialog>
    </div>
  );
}
