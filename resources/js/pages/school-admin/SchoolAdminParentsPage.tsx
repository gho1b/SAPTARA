import { useState, useEffect } from "react";
import { schoolAdminService } from "../../services/school-admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Dialog } from "../../components/ui/Dialog";
import {
  HeartHandshake,
  Plus,
  Search,
  Mail,
  Users,
  Ship,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

export function SchoolAdminParentsPage() {
  const [studentsWithParents, setStudentsWithParents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Link Modal
  const [linkModal, setLinkModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");
  const [parentEmail, setParentEmail] = useState("");
  const [linking, setLinking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linkedList, studentRes] = await Promise.all([
        schoolAdminService.getParents(),
        schoolAdminService.getStudents({ per_page: 100 }),
      ]);
      setStudentsWithParents(linkedList);
      setAllStudents(studentRes.data || []);
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal memuat data wali murid." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenLink = (st?: any) => {
    if (st) {
      setSelectedStudentId(st.id);
      setParentEmail(st.parent_email || st.parentEmail || "");
    } else {
      setSelectedStudentId(allStudents[0]?.id || "");
      setParentEmail("");
    }
    setLinkModal(true);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setLinking(true);
    setAlertMsg(null);
    try {
      const res = await schoolAdminService.linkParent(Number(selectedStudentId), parentEmail.trim());
      setAlertMsg({ type: "success", text: res.message });
      setLinkModal(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menautkan email orang tua." });
    } finally {
      setLinking(false);
    }
  };

  const filteredList = studentsWithParents.filter((st) => {
    const q = search.toLowerCase();
    const email = (st.parent_email || st.parentEmail || "").toLowerCase();
    const name = (st.name || "").toLowerCase();
    const nis = (st.nis || "").toLowerCase();
    return email.includes(q) || name.includes(q) || nis.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-amber-600" />
            <span>Kemitraan Wali Murid</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola penautan akun orang tua/wali murid dengan siswa untuk akses pantauan 7 kebiasaan
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleOpenLink()}
          disabled={allStudents.length === 0}
          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-xs text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Tautkan Wali Murid</span>
        </Button>
      </div>

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

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari email wali, nama anak, atau NIS..."
          className="pl-9 text-xs"
        />
      </div>

      {/* Parents Table */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Email Wali Murid</th>
                <th className="py-3 px-4">Anak yang Ditautkan</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Rombel / Kelas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Memuat data kemitraan orang tua...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Belum ada akun wali murid yang ditautkan ke siswa.
                  </td>
                </tr>
              ) : (
                filteredList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-amber-600" />
                        <span>{st.parent_email || st.parentEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{st.avatar || "🦊"}</span>
                        <span>{st.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {st.nis || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {st.school_class?.class_code || st.schoolClass?.classCode || "Kelas"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenLink(st)}
                        className="h-8 text-xs gap-1 text-sky-700 border-sky-200 hover:bg-sky-50"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span>Ubah Email</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tautkan Orang Tua */}
      <Dialog
        open={linkModal}
        onClose={() => setLinkModal(false)}
        title="Tautkan Email Wali Murid 🌿"
        description="Hubungkan email orang tua agar dapat masuk ke akses pantauan anak"
      >
        <form onSubmit={handleLinkSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pilih Siswa
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-hidden"
            >
              <option value="" disabled>-- Pilih Siswa --</option>
              {allStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} (NIS: {st.nis || "-"}) - Kelas: {st.school_class?.class_code || st.schoolClass?.classCode || "-"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Resmi Wali Murid
            </label>
            <Input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="contoh: ayah.budi@gmail.com"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Orang tua dapat masuk ke pantauan anak dengan memasukkan email ini di tab Orang Tua.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setLinkModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={linking}>
              {linking ? "Menautkan..." : "Simpan Tautan"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

