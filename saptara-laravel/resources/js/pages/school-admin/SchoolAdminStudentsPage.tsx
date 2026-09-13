import { useState, useEffect } from "react";
import { schoolAdminService } from "../../services/school-admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Dialog } from "../../components/ui/Dialog";
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Printer,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Ship,
  Mail,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AVATARS = ["🦊", "🦁", "🐼", "🐨", "🐯", "🐰", "🐬", "🦉", "🦄", "🚀", "⚓", "🧭"];

export function SchoolAdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visiblePins, setVisiblePins] = useState<Record<number, boolean>>({});
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Create
  const [createModal, setCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<number | "">("");
  const [nis, setNis] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [parentEmail, setParentEmail] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Modal Edit
  const [editModal, setEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editClassId, setEditClassId] = useState<number | "">("");
  const [editNis, setEditNis] = useState("");
  const [editAccessCode, setEditAccessCode] = useState("");
  const [editAvatar, setEditAvatar] = useState("🦊");
  const [editParentEmail, setEditParentEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Modal Print Card
  const [printModal, setPrintModal] = useState(false);
  const [printingStudent, setPrintingStudent] = useState<any | null>(null);

  const fetchClasses = async () => {
    try {
      const cls = await schoolAdminService.getClasses();
      setClasses(cls);
      const storedSchool = schoolAdminService.getStoredSchool();
      setSchool(storedSchool);
    } catch (err) {}
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await schoolAdminService.getStudents({
        class_id: selectedClassId ? Number(selectedClassId) : undefined,
        search: search.trim() || undefined,
        page,
        per_page: 20,
      });
      setStudents(data.data || []);
      setPagination(data);
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal memuat siswa." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedClassId, search, page]);

  const togglePin = (id: number) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = () => {
    setName("");
    setClassId(classes[0]?.id || "");
    setNis("");
    setAccessCode("");
    setAvatar("🦊");
    setParentEmail("");
    setCreateModal(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      setAlertMsg({ type: "error", text: "Pilih kelas untuk siswa terlebih dahulu." });
      return;
    }
    setCreateLoading(true);
    setAlertMsg(null);
    try {
      const res = await schoolAdminService.createStudent({
        name,
        class_id: Number(classId),
        nis: nis.trim() || undefined,
        access_code: accessCode.trim() || undefined,
        avatar,
        parent_email: parentEmail.trim() || undefined,
      });
      setAlertMsg({ type: "success", text: res.message });
      setCreateModal(false);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menambahkan siswa." });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (st: any) => {
    setEditingStudent(st);
    setEditName(st.name || "");
    setEditClassId(st.class_id || st.classId || "");
    setEditNis(st.nis || "");
    setEditAccessCode(st.access_code || st.accessCode || "");
    setEditAvatar(st.avatar || "🦊");
    setEditParentEmail(st.parent_email || st.parentEmail || "");
    setEditModal(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditLoading(true);
    setAlertMsg(null);
    try {
      const res = await schoolAdminService.updateStudent(editingStudent.id, {
        name: editName,
        class_id: Number(editClassId),
        nis: editNis.trim(),
        access_code: editAccessCode.trim(),
        avatar: editAvatar,
        parent_email: editParentEmail.trim() || undefined,
      });
      setAlertMsg({ type: "success", text: res.message });
      setEditModal(false);
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal memperbarui data siswa." });
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPin = async (st: any) => {
    if (!window.confirm(`Reset PIN akses untuk siswa "${st.name}"?`)) return;
    setAlertMsg(null);
    try {
      const res = await schoolAdminService.resetStudentPin(st.id);
      setAlertMsg({ type: "success", text: res.message });
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal mereset PIN siswa." });
    }
  };

  const handleDeleteStudent = async (st: any) => {
    if (!window.confirm(`Yakin ingin menghapus siswa "${st.name}" dari sistem sekolah?`)) return;
    setAlertMsg(null);
    try {
      const res = await schoolAdminService.deleteStudent(st.id);
      setAlertMsg({ type: "success", text: res.message });
      fetchStudents();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menghapus siswa." });
    }
  };

  const handleOpenPrint = (st?: any) => {
    setPrintingStudent(st || null);
    setPrintModal(true);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <span>Manajemen Awak Siswa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data pokok siswa, NIS, kode PIN akses, dan cetak kartu kredensial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenPrint()}
            disabled={students.length === 0}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Cetak Kartu Siswa</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            disabled={classes.length === 0}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Siswa</span>
          </Button>
        </div>
      </div>

      {classes.length === 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Sekolah ini belum memiliki rombel kelas. Silakan buat kelas terlebih dahulu di menu Rombel & Kelas.
          </span>
        </div>
      )}

      {/* Alert banner */}
      {alertMsg && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
            alertMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {alertMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama siswa atau NIS..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value ? Number(e.target.value) : "");
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-hidden"
          >
            <option value="">Semua Rombel / Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_code || c.classCode} ({c.ship_name || c.shipName || "Kapal"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Rombel Kelas</th>
                <th className="py-3 px-4">PIN Akses (6 Digit)</th>
                <th className="py-3 px-4">Wali Murid</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada siswa yang ditemukan.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const pin = st.access_code || st.accessCode || "";
                  const isVisible = visiblePins[st.id] ?? false;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{st.avatar || "🦊"}</span>
                          <span>{st.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {st.nis || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px]">
                          <Ship className="h-3 w-3" />
                          <span>{st.school_class?.class_code || st.schoolClass?.classCode || "Kelas"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                            {isVisible ? pin : "••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePin(st.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                            title={isVisible ? "Sembunyikan PIN" : "Lihat PIN"}
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {st.parent_email || st.parentEmail ? (
                          <span className="text-slate-600 text-[11px] flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{st.parent_email || st.parentEmail}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Belum ditautkan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPrint(st)}
                            className="h-8 text-xs gap-1 text-slate-700 hover:bg-slate-50"
                            title="Pratinjau Kartu Siswa"
                          >
                            <Printer className="h-3 w-3 text-slate-500" />
                            <span>Kartu</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(st)}
                            className="h-8 text-xs gap-1 text-sky-700 border-sky-200 hover:bg-sky-50"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPin(st)}
                            className="h-8 text-xs gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                            title="Reset PIN Akses"
                          >
                            <KeyRound className="h-3 w-3" />
                            <span>Reset PIN</span>
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteStudent(st)}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <div>
              Menampilkan {pagination.from ?? 0} - {pagination.to ?? 0} dari {pagination.total} siswa
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </Button>
              <span className="px-2 font-semibold text-slate-700">
                Hal {pagination.current_page} / {pagination.last_page}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={page >= pagination.last_page}
                className="h-8 text-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Tambah Siswa */}
      <Dialog
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Tambah Siswa Baru 🧑‍🎓"
        description="Daftarkan siswa baru ke rombel kelas yang ditentukan"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pilih Rombel / Kelas
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-hidden"
            >
              <option value="" disabled>-- Pilih Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_code || c.classCode} - {c.ship_name || c.shipName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap Siswa
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kaisara Aqilla"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NIS <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              <Input
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Buat otomatis jika kosong"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                PIN Akses <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Acak 6-digit jika kosong"
                maxLength={20}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Wali Murid <span className="text-slate-400 font-normal lowercase">(opsional)</span>
            </label>
            <Input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="ortu@gmail.com"
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
                  onClick={() => setAvatar(av)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all cursor-pointer ${
                    avatar === av
                      ? "bg-emerald-600 text-white shadow-md scale-110"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={createLoading}>
              {createLoading ? "Menyimpan..." : "Simpan Siswa"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Edit Siswa */}
      <Dialog
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Data Siswa ✏️"
        description="Perbarui informasi data siswa, nomor induk, atau PIN akses"
      >
        <form onSubmit={handleEditStudent} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Rombel / Kelas
            </label>
            <select
              value={editClassId}
              onChange={(e) => setEditClassId(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_code || c.classCode} - {c.ship_name || c.shipName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap Siswa
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nama siswa"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NIS
              </label>
              <Input
                value={editNis}
                onChange={(e) => setEditNis(e.target.value)}
                placeholder="NIS Siswa"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                PIN Akses (6 Digit)
              </label>
              <Input
                value={editAccessCode}
                onChange={(e) => setEditAccessCode(e.target.value)}
                placeholder="PIN"
                maxLength={20}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Wali Murid
            </label>
            <Input
              type="email"
              value={editParentEmail}
              onChange={(e) => setEditParentEmail(e.target.value)}
              placeholder="ortu@gmail.com"
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
                  onClick={() => setEditAvatar(av)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all cursor-pointer ${
                    editAvatar === av
                      ? "bg-emerald-600 text-white shadow-md scale-110"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setEditModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Cetak Kartu */}
      <Dialog
        open={printModal}
        onClose={() => setPrintModal(false)}
        title="Cetak Kartu Akses Siswa 🪪"
        description="Kartu kredensial login mandiri siap cetak dan dibagikan ke siswa atau wali murid"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              {printingStudent
                ? `Pratinjau kartu untuk ${printingStudent.name}`
                : `Pratinjau kartu untuk seluruh siswa (${students.length} siswa)`}
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={handleTriggerPrint}
              className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Sekarang</span>
            </Button>
          </div>

          {/* Printable Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1 print:p-0 print:overflow-visible">
            {(printingStudent ? [printingStudent] : students).map((st) => (
              <div
                key={st.id}
                className="rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/50 p-3.5 shadow-sm space-y-2.5 relative overflow-hidden"
              >
                {/* School Header */}
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">⚓</span>
                    <span className="font-display font-black text-[11px] text-sky-950 tracking-wider">
                      SAPTARA
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[140px]">
                    {school?.name || "Sekolah"}
                  </span>
                </div>

                {/* Body */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                    {st.avatar || "🦊"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-black text-xs text-slate-900 truncate">
                      {st.name}
                    </p>
                    <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
                      ⛵ {st.school_class?.class_code || st.schoolClass?.classCode || "Kelas"}
                    </p>
                  </div>
                </div>

                {/* Credentials Box */}
                <div className="rounded-xl bg-white border border-sky-200/80 p-2 text-center grid grid-cols-2 gap-1 shadow-2xs">
                  <div className="border-r border-slate-100 pr-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      NIS Siswa
                    </span>
                    <span className="font-mono font-black text-xs text-slate-900 block">
                      {st.nis || "-"}
                    </span>
                  </div>
                  <div className="pl-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block">
                      Kode PIN
                    </span>
                    <span className="font-mono font-black text-xs text-emerald-700 block">
                      {st.access_code || st.accessCode || "123456"}
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-center text-slate-400">
                  Gunakan NIS & PIN untuk login di aplikasi SAPTARA
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setPrintModal(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

