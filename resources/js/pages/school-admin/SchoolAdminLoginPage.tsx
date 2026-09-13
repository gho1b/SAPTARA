import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { schoolAdminService } from "../../services/school-admin.service";
import { schoolService } from "../../services/school.service";
import type { School } from "../../types";
import { SchoolSelectCombobox } from "../../components/SchoolSelectCombobox";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ShieldCheck, ArrowRight, AlertCircle, ArrowLeft, Building2 } from "lucide-react";

export function SchoolAdminLoginPage() {
  const navigate = useNavigate();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(() => schoolService.getStoredSchool());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolAdminService.isAuthenticated()) {
      navigate("/school-admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) {
      setErrorMsg("Silakan cari dan pilih sekolah Anda terlebih dahulu.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      await schoolAdminService.login(selectedSchool.id, email, password);
      navigate("/school-admin/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk. Periksa email, password, dan sekolah yang dipilih.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 px-4 py-12">
      {/* Back button */}
      <div className="w-full max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda Utama</span>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-white border-slate-200/80 shadow-2xl overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 p-6 text-white text-center relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-3xl mb-3 shadow-inner">
            🏫
          </div>
          <h1 className="font-display font-black text-xl tracking-tight">Portal Admin Sekolah</h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            Pusat operasional data guru, rombel kelas, siswa & wali murid
          </p>
        </div>

        <CardContent className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: School Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Pilih Sekolah Anda
              </label>
              <SchoolSelectCombobox
                selectedSchool={selectedSchool}
                onSelectSchool={(sch) => {
                  setSelectedSchool(sch);
                  setErrorMsg(null);
                }}
              />
            </div>

            {/* Step 2: Email khusus Admin Sekolah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Email Khusus Admin Sekolah
              </label>
              <Input
                type="email"
                placeholder="contoh: admin@samudra.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Gunakan email institusi yang didaftarkan khusus sebagai operator sekolah.
              </span>
            </div>

            {/* Step 3: Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Kata Sandi
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !selectedSchool}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 font-display mt-2"
            >
              <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard Sekolah"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/admin/login" className="text-slate-400 hover:text-slate-600 font-medium">
              Portal Super Admin
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/" className="text-emerald-700 hover:underline font-semibold">
              Masuk Guru / Siswa
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

