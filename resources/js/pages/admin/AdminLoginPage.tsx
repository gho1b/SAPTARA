import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/admin.service";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { ShieldCheck, AlertCircle, Lock, Mail, ArrowRight } from "lucide-react";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (adminService.isAuthenticated()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Harap masukkan email dan kata sandi");
      return;
    }

    setLoading(true);
    try {
      await adminService.login(email.trim(), password);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Login administrator gagal. Periksa kembali kredensial Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20 mb-2">
            ⚓
          </div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            SAPTARA Backoffice
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Portal Khusus Administrator & Manajemen Multi-Tenant
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400 mx-auto mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Autentikasi Administrator</span>
            </div>
            <CardTitle className="text-base text-slate-200">Masuk ke Ruang Kendali</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Gunakan akun Super Admin yang memiliki hak akses sistem
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-semibold text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Administrator
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    placeholder="admin@saptara.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold font-display shadow-md shadow-amber-500/10 gap-2"
              >
                {loading ? "Memverifikasi..." : "Masuk Sebagai Administrator"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <a
                href="/"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
              >
                ← Kembali ke Halaman Utama Pengguna
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

