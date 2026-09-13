import { useState, useEffect } from "react";
import { adminService, type PaginatedSchools } from "../../services/admin.service";
import type { School } from "../../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AdminSchoolFormModal } from "./AdminSchoolFormModal";
import { AdminSchoolDetailModal } from "./AdminSchoolDetailModal";
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Power,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

export function AdminSchoolListPage() {
  const [paginated, setPaginated] = useState<PaginatedSchools | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSchoolId, setDetailSchoolId] = useState<number | null>(null);

  const handleOpenDetail = (schoolId: number) => {
    setDetailSchoolId(schoolId);
    setDetailModalOpen(true);
  };

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSchools({
        search: search.trim() || undefined,
        status: statusFilter,
        page,
        perPage: 15,
      });
      setPaginated(data);
    } catch (err: any) {
      console.error("Failed to fetch schools:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  const handleOpenCreate = () => {
    setSchoolToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setSchoolToEdit(school);
    setModalOpen(true);
  };

  const handleToggleStatus = async (school: School) => {
    setActionLoading(school.id);
    setAlertMsg(null);
    try {
      const res = await adminService.toggleSchoolStatus(school.id);
      setAlertMsg({ type: "success", text: res.message });
      fetchSchools();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal mengubah status sekolah" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (school: School) => {
    if (!window.confirm(`Yakin ingin menghapus master data sekolah "${school.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setActionLoading(school.id);
    setAlertMsg(null);
    try {
      const res = await adminService.deleteSchool(school.id);
      setAlertMsg({ type: "success", text: res.message });
      fetchSchools();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menghapus sekolah" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-sky-600" />
            <span>Master Data Sekolah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh sekolah yang terdaftar sebagai tenant dalam platform SAPTARA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSchools}
            className="text-slate-600 hover:bg-slate-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-display shadow-sm gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Sekolah Baru</span>
          </Button>
        </div>
      </div>

      {alertMsg && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold animate-in fade-in ${
            alertMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            className="text-slate-400 hover:text-slate-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <Card className="bg-white border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari berdasarkan Nama Sekolah, NPSN, Kota, atau Provinsi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9.5 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("active");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "active"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("inactive");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "inactive"
                    ? "bg-white text-rose-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Non-aktif
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table Card */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Sekolah</th>
                <th className="py-3 px-4">NPSN</th>
                <th className="py-3 px-4">Wilayah</th>
                <th className="py-3 px-4">Kontak Resmi</th>
                <th className="py-3 px-4 text-center">Kelas / Guru / Siswa</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (!paginated || paginated.data.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data master sekolah...
                  </td>
                </tr>
              ) : !paginated || paginated.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data sekolah yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.data.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sekolah & Logo */}
                    <td className="py-3.5 px-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => handleOpenDetail(sch.id)}
                        title="Klik untuk melihat detail sekolah"
                      >
                        <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
                          {sch.logo ? (
                            <img src={sch.logo} alt={sch.name} className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs group-hover:text-sky-600 transition-colors">
                            {sch.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            /{sch.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* NPSN */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {sch.npsn}
                      </span>
                    </td>

                    {/* Wilayah */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 block">
                          {sch.city || "-"}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {sch.province || "-"}
                        </span>
                        {sch.address && (
                          <span className="text-[10px] text-slate-400 block max-w-xs truncate" title={sch.address}>
                            {sch.address}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="space-y-0.5">
                        {sch.phone && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{sch.phone}</span>
                          </div>
                        )}
                        {sch.email && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{sch.email}</span>
                          </div>
                        )}
                        {sch.website && (
                          <a
                            href={sch.website.startsWith("http") ? sch.website : `https://${sch.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sky-600 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{sch.website}</span>
                          </a>
                        )}
                        {!sch.phone && !sch.email && !sch.website && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Counts */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span title="Jumlah Kelas / Kapal">⛵ {sch.classes_count ?? 0}</span>
                        <span>•</span>
                        <span title="Jumlah Guru">👨‍🏫 {sch.teachers_count ?? 0}</span>
                        <span>•</span>
                        <span title="Jumlah Siswa">🧑‍🎓 {sch.students_count ?? 0}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          sch.isActive ?? true
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {sch.isActive ?? true ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(sch.id)}
                          className="h-8 gap-1 text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
                          title="Lihat Detail Sekolah"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Detail</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(sch)}
                          className="h-8 gap-1 text-xs text-sky-700 border-sky-200 hover:bg-sky-50"
                          title="Edit Data Sekolah"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(sch)}
                          disabled={actionLoading === sch.id}
                          className={`h-8 gap-1 text-xs ${
                            sch.isActive ?? true
                              ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                          title={sch.isActive ?? true ? "Nonaktifkan Sekolah" : "Aktifkan Sekolah"}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">
                            {sch.isActive ?? true ? "Nonaktifkan" : "Aktifkan"}
                          </span>
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(sch)}
                          disabled={actionLoading === sch.id || (sch.students_count ?? 0) > 0}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                          title={
                            (sch.students_count ?? 0) > 0
                              ? "Tidak dapat dihapus karena memiliki siswa terdaftar"
                              : "Hapus Sekolah"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {paginated && paginated.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <div>
              Menampilkan {paginated.from ?? 0} - {paginated.to ?? 0} dari {paginated.total} sekolah
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
                Halaman {paginated.current_page} / {paginated.last_page}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(paginated.last_page, p + 1))}
                disabled={page >= paginated.last_page}
                className="h-8 text-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Add / Edit */}
      <AdminSchoolFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        schoolToEdit={schoolToEdit}
        onSuccess={() => {
          fetchSchools();
        }}
      />

      {/* Modal Detail Sekolah */}
      <AdminSchoolDetailModal
        open={detailModalOpen}
        schoolId={detailSchoolId}
        onClose={() => setDetailModalOpen(false)}
        onEdit={(sch) => handleOpenEdit(sch)}
      />
    </div>
  );
}

