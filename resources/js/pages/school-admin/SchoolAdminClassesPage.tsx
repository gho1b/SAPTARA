import { useState, useEffect } from "react";
import { schoolAdminService } from "../../services/school-admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Dialog } from "../../components/ui/Dialog";
import {
  Ship,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  GraduationCap,
} from "lucide-react";

export function SchoolAdminClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [classCode, setClassCode] = useState("");
  const [shipName, setShipName] = useState("");
  const [teacherId, setTeacherId] = useState<number | "">("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classList, teacherList] = await Promise.all([
        schoolAdminService.getClasses(),
        schoolAdminService.getTeachers(),
      ]);
      setClasses(classList);
      setTeachers(teacherList);
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal memuat data rombel kelas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setClassCode("");
    setShipName("");
    setTeacherId(teachers[0]?.id || "");
    setSemester("Ganjil");
    setTahunAjaran("2026/2027");
    setModalOpen(true);
  };

  const handleOpenEdit = (cls: any) => {
    setEditingClass(cls);
    setClassCode(cls.class_code || cls.classCode || "");
    setShipName(cls.ship_name || cls.shipName || "");
    setTeacherId(cls.teacher_id || cls.teacherId || "");
    setSemester(cls.semester || "Ganjil");
    setTahunAjaran(cls.tahun_ajaran || "2026/2027");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      setAlertMsg({ type: "error", text: "Pilih wali kelas terlebih dahulu." });
      return;
    }

    setSubmitting(true);
    setAlertMsg(null);
    try {
      if (editingClass) {
        const res = await schoolAdminService.updateClass(editingClass.id, {
          class_code: classCode,
          ship_name: shipName,
          teacher_id: Number(teacherId),
          semester,
          tahun_ajaran: tahunAjaran,
        });
        setAlertMsg({ type: "success", text: res.message });
      } else {
        const res = await schoolAdminService.createClass({
          class_code: classCode,
          ship_name: shipName,
          teacher_id: Number(teacherId),
          semester,
          tahun_ajaran: tahunAjaran,
        });
        setAlertMsg({ type: "success", text: res.message });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menyimpan data kelas." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (cls: any) => {
    if (!window.confirm(`Yakin ingin menghapus rombel kelas "${cls.class_code}"?`)) return;
    setAlertMsg(null);
    try {
      const res = await schoolAdminService.deleteClass(cls.id);
      setAlertMsg({ type: "success", text: res.message });
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menghapus kelas." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Ship className="h-6 w-6 text-sky-600" />
            <span>Rombel & Kapal Layar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola rombongan belajar, nama kapal layar per kelas, dan penugasan wali kelas
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          disabled={teachers.length === 0}
          className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kelas Baru</span>
        </Button>
      </div>

      {teachers.length === 0 && !loading && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Sekolah ini belum memiliki Dewan Guru. Silakan tambahkan guru terlebih dahulu sebelum membuat kelas.
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

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Memuat rombongan belajar...
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            Belum ada rombel kelas yang dibuat. Klik tombol di atas untuk membuat kelas pertama.
          </div>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id} className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-display font-black text-base text-slate-900 block">
                      {cls.class_code || cls.classCode}
                    </span>
                    <span className="text-xs font-semibold text-sky-700 flex items-center gap-1 mt-0.5">
                      <Ship className="h-3.5 w-3.5" />
                      <span>{cls.ship_name || cls.shipName || "Kapal Layar"}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {cls.students_count ?? 0} siswa
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                    <span>Wali: {cls.teacher?.display_name || cls.teacher?.user?.name || "Belum ditentukan"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>Semester: {cls.semester || "Ganjil"}</span>
                    <span>TA: {cls.tahun_ajaran || "2026/2027"}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-1 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(cls)}
                    className="h-7 text-xs gap-1 text-sky-700 border-sky-200 hover:bg-sky-50"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteClass(cls)}
                    disabled={(cls.students_count ?? 0) > 0}
                    className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                    title={
                      (cls.students_count ?? 0) > 0
                        ? "Tidak dapat dihapus karena masih ada siswa"
                        : "Hapus Kelas"
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Add / Edit Class */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? "Edit Rombel Kelas ✏️" : "Tambah Kelas Baru ⛵"}
        description="Atur kode rombel, nama kapal pelayaran kelas, dan pilih wali kelas pengampu"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Kode Kelas (Contoh: 7A, 4B, 1C)
            </label>
            <Input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Contoh: 7A"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Kapal Layar
            </label>
            <Input
              value={shipName}
              onChange={(e) => setShipName(e.target.value)}
              placeholder="Contoh: KRI Samudra Perkasa"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Wali Kelas Pengampu
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-hidden"
            >
              <option value="" disabled>
                -- Pilih Wali Kelas --
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.display_name || t.user?.name} ({t.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-hidden"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tahun Ajaran
              </label>
              <Input
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2026/2027"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editingClass ? "Simpan Perubahan" : "Buat Kelas"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

