import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { schoolAdminService, type SchoolAdminDashboardData } from "../../services/school-admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  GraduationCap,
  Ship,
  Users,
  HeartHandshake,
  ArrowRight,
  Plus,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

export function SchoolAdminDashboardPage() {
  const [data, setData] = useState<SchoolAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await schoolAdminService.getDashboardStats();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Gagal memuat statistik dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-2">
        <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Menghubungkan ke server sekolah...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <p className="font-bold text-sm mb-1">Gagal memuat data dashboard</p>
        <p>{error}</p>
        <Button size="sm" variant="outline" onClick={fetchStats} className="mt-3">
          Coba Lagi
        </Button>
      </div>
    );
  }

  const { school, stats, recent_students, classes } = data;

  return (
    <div className="space-y-6">
      {/* School Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {school.logo ? (
            <img
              src={school.logo}
              alt={school.name}
              className="h-16 w-16 rounded-2xl object-contain bg-white p-1 shadow-md shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 border border-white/20">
              🏫
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold font-display tracking-tight text-white">
                {school.name}
              </h1>
              <span className="font-mono bg-white/10 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
                NPSN: {school.npsn}
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
              {[school.address, school.city, school.province].filter(Boolean).join(", ") ||
                "Alamat sekolah belum dilengkapi"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <Link to="/school-admin/profile" className="flex-1 md:flex-initial">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border-emerald-300"
            >
              <Building2 className="h-3.5 w-3.5 mr-1" />
              <span>Kelola Profil Sekolah</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Guru */}
        <Link to="/school-admin/teachers" className="block group">
          <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-xs text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  Kelola →
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{stats.total_teachers}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Dewan Guru</p>
            </CardContent>
          </Card>
        </Link>

        {/* Kelas */}
        <Link to="/school-admin/classes" className="block group">
          <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                  <Ship className="h-5 w-5" />
                </div>
                <span className="text-xs text-sky-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  Kelola →
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{stats.total_classes}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Rombel & Kapal</p>
            </CardContent>
          </Card>
        </Link>

        {/* Siswa */}
        <Link to="/school-admin/students" className="block group">
          <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  Kelola →
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{stats.total_students}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Awak Siswa</p>
            </CardContent>
          </Card>
        </Link>

        {/* Ortu */}
        <Link to="/school-admin/parents" className="block group">
          <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <span className="text-xs text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  Kelola →
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{stats.linked_parents_count}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Wali Terhubung</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Grid 2 Kolom: Kelas & Siswa Baru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rombel Kelas Aktif */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Ship className="h-4 w-4 text-sky-600" />
                <span>Rombel & Kapal Layar</span>
              </CardTitle>
              <CardDescription className="text-xs">Kelas yang aktif di sekolah ini</CardDescription>
            </div>
            <Link to="/school-admin/classes">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-sky-600 hover:text-sky-700 gap-1">
                <span>Semua Kelas</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {classes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada rombel kelas yang dibuat.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {classes.slice(0, 5).map((cls) => (
                  <div key={cls.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{cls.class_code || cls.classCode}</span>
                        <span className="text-xs text-sky-700 font-semibold">• {cls.ship_name || cls.shipName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Wali: {cls.teacher?.user?.name || "Belum ada wali"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {cls.students_count ?? 0} siswa
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Siswa Terbaru */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>Siswa Terbaru</span>
              </CardTitle>
              <CardDescription className="text-xs">Pendaftaran siswa paling mutakhir</CardDescription>
            </div>
            <Link to="/school-admin/students">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-600 hover:text-emerald-700 gap-1">
                <span>Semua Siswa</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {recent_students.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada siswa yang didaftarkan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent_students.map((st) => (
                  <div key={st.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{st.avatar || "🦊"}</span>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{st.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">NIS: {st.nis || "-"}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                      PIN: {st.access_code || st.accessCode || "******"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

