import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService, type AdminStats } from "../../services/admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { AdminSchoolFormModal } from "./AdminSchoolFormModal";
import {
  Building2,
  Users,
  GraduationCap,
  Ship,
  Sparkles,
  Plus,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sistem Multi-Tenant Sekolah SAPTARA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            Selamat Datang di Ruang Kendali Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Kelola data induk sekolah nasional, monitor rombongan belajar (kapal), guru, dan kebiasaan siswa di seluruh Indonesia dalam satu basis data terpadu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStats}
            className="text-slate-300 border-slate-700 hover:bg-slate-800"
            title="Muat Ulang Statistik"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={() => setModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-display shadow-md shadow-amber-500/10 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Sekolah</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sekolah */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Sekolah
              </span>
              <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                {stats?.total_schools ?? 0}
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats?.active_schools ?? 0} Aktif
                </span>
                {Boolean(stats?.inactive_schools) && (
                  <span className="text-slate-400">
                    • {stats?.inactive_schools} Non-aktif
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guru */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Guru Terdaftar
              </span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                {stats?.total_teachers ?? 0}
              </span>
              <p className="text-xs text-slate-400 mt-1">Pendidik & Pembina Karakter</p>
            </div>
          </CardContent>
        </Card>

        {/* Siswa */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Siswa
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                {stats?.total_students ?? 0}
              </span>
              <p className="text-xs text-slate-400 mt-1">Awak Siswa Berlayar</p>
            </div>
          </CardContent>
        </Card>

        {/* Aktivitas Kebiasaan */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aktivitas Kebiasaan
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                {stats?.total_habit_logs ?? 0}
              </span>
              <p className="text-xs text-slate-400 mt-1">Catatan Kebiasaan Baik</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Schools & Architecture Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Schools Table (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Sekolah yang Baru Terdaftar
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Sekolah terbaru dalam sistem multi-tenant
                </CardDescription>
              </div>

              <Link
                to="/admin/schools"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                <span>Lihat Semua Sekolah</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat data sekolah...</div>
              ) : !stats?.recent_schools || stats.recent_schools.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Belum ada sekolah terdaftar.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recent_schools.map((sch) => (
                    <div
                      key={sch.id}
                      className="flex items-center justify-between py-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                          {sch.logo ? (
                            <img
                              src={sch.logo}
                              alt={sch.name}
                              className="h-full w-full object-cover rounded-xl"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900">{sch.name}</h4>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                              {sch.npsn}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {sch.city || "Kota belum diatur"}, {sch.province || "Provinsi belum diatur"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <div className="hidden sm:block text-right">
                          <span className="text-slate-800 block text-[11px]">
                            {sch.classes_count ?? 0} Kelas • {sch.students_count ?? 0} Siswa
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sch.isActive ?? true
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {sch.isActive ?? true ? "Aktif" : "Non-aktif"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Guidelines & Roles */}
        <div>
          <Card className="border-slate-200/80 bg-gradient-to-b from-sky-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Pilar Arsitektur Multi-Tenant
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Aturan & alur tata kelola SAPTARA
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-800 block font-semibold">Master Data Terpusat</strong>
                  <span>Hanya Super Admin yang dapat menambahkan & memverifikasi NPSN sekolah resmi.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-800 block font-semibold">Autentikasi Terisolasi</strong>
                  <span>Siswa dan wali murid masuk menggunakan NIS dan PIN unik yang divalidasi per sekolah terpilih.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-800 block font-semibold">Satu Database Berkelanjutan</strong>
                  <span>Semua entitas berada di satu basis data dengan isolasi relasi berbasis foreign key `school_id`.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70">
                <Link
                  to="/admin/schools"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Buka Kelola Master Sekolah</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Add School */}
      <AdminSchoolFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchStats();
        }}
      />
    </div>
  );
}

