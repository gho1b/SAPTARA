import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { useStudentInfo, useTeacherInfo, useParentInfo } from "../hooks/use-auth";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Tabs } from "../components/ui/Tabs";
import { Sparkles, Ship, GraduationCap, HeartHandshake, Compass, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const studentInfo = useStudentInfo();
  const teacherInfo = useTeacherInfo();
  const parentInfo = useParentInfo();

  const [activeRole, setActiveRole] = useState<string>("student");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Student Form
  const [studentName, setStudentName] = useState("");
  const [studentClassCode, setStudentClassCode] = useState("");

  // Teacher Form
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [isTeacherRegister, setIsTeacherRegister] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  // Parent Form
  const [parentChildName, setParentChildName] = useState("");
  const [parentClassCode, setParentClassCode] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (studentInfo) {
      navigate("/student/map", { replace: true });
    } else if (teacherInfo) {
      navigate("/teacher/feed", { replace: true });
    } else if (parentInfo) {
      navigate("/parent/feed", { replace: true });
    }
  }, [studentInfo, teacherInfo, parentInfo, navigate]);

  // Student Login Handler
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!studentName || !studentClassCode) {
      setErrorMsg("Harap masukkan nama dan kode kelas");
      return;
    }

    setLoading(true);
    try {
      await authService.studentLogin(studentName, studentClassCode.toUpperCase());
      navigate("/student/map");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk sebagai siswa. Periksa nama & kode kelas.");
    } finally {
      setLoading(false);
    }
  };

  // Teacher Login/Register Handler
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!teacherEmail || !teacherPassword) {
      setErrorMsg("Harap isi email dan password");
      return;
    }

    setLoading(true);
    try {
      if (isTeacherRegister) {
        if (!teacherName) {
          setErrorMsg("Harap masukkan nama lengkap guru");
          setLoading(false);
          return;
        }
        await authService.teacherRegister(teacherName, teacherEmail, teacherPassword);
      } else {
        await authService.teacherLogin(teacherEmail, teacherPassword);
      }
      navigate("/teacher/feed");
    } catch (err: any) {
      setErrorMsg(err.message || "Login guru gagal. Periksa kembali email dan password.");
    } finally {
      setLoading(false);
    }
  };

  // Parent Login Handler
  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!parentChildName || !parentClassCode) {
      setErrorMsg("Harap masukkan nama anak dan kode kelas");
      return;
    }

    setLoading(true);
    try {
      await authService.parentLogin(parentChildName, parentClassCode.toUpperCase());
      navigate("/parent/feed");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk wali murid. Periksa nama anak & kode kelas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-amber-50/30">
      {/* Hero Header */}
      <div className="relative overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12 text-center px-4">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-tr from-sky-200/40 via-amber-100/40 to-blue-200/30 blur-3xl -z-10 rounded-full" />

        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1.5 shadow-sm text-xs font-bold text-sky-700 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>7 Kebiasaan Anak Indonesia Hebat</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          SAPTARA
        </h1>
        <p className="font-display text-base sm:text-lg font-semibold text-sky-600 mt-1">
          ⚓ Petualangan Mengarungi Samudra Kebiasaan Mulia ⚓
        </p>
        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          Mencatat, menumbuhkan, dan memonitor kebiasaan positif siswa melalui kolaborasi menyenangkan antara Siswa, Guru, dan Orang Tua.
        </p>
      </div>

      {/* Main Login Card with Role Tabs */}
      <div className="max-w-md mx-auto px-4 pb-16">
        <Card className="border-sky-200 shadow-xl shadow-sky-500/5 bg-white/95">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="font-display text-xl text-slate-800">
              Pintu Gerbang Samudra
            </CardTitle>
            <CardDescription>Pilih peranmu untuk masuk ke dalam kapal</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              activeTab={activeRole}
              onChange={(id) => {
                setActiveRole(id);
                setErrorMsg(null);
              }}
              tabs={[
                { id: "student", label: "Siswa", icon: <Ship className="h-4 w-4" /> },
                { id: "teacher", label: "Guru", icon: <GraduationCap className="h-4 w-4" /> },
                { id: "parent", label: "Orang Tua", icon: <HeartHandshake className="h-4 w-4" /> },
              ]}
            />

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Student Login Tab */}
            {activeRole === "student" && (
              <form onSubmit={handleStudentSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Siswa
                  </label>
                  <Input
                    placeholder="Contoh: Budi Santoso"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Kelas
                  </label>
                  <Input
                    placeholder="Contoh: KLS-7A"
                    value={studentClassCode}
                    onChange={(e) => setStudentClassCode(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  disabled={loading}
                  className="w-full mt-2 font-display text-base"
                >
                  {loading ? "Berlayar..." : "⛵ Berlayar Sekarang!"}
                </Button>
              </form>
            )}

            {/* Teacher Login Tab */}
            {activeRole === "teacher" && (
              <form onSubmit={handleTeacherSubmit} className="space-y-3 pt-1">
                {isTeacherRegister && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Guru
                    </label>
                    <Input
                      placeholder="Nama Lengkap & Gelar"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Guru
                  </label>
                  <Input
                    type="email"
                    placeholder="guru@sekolah.sch.id"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? "Memproses..." : isTeacherRegister ? "Daftar Guru Baru" : "Masuk sebagai Guru"}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTeacherRegister(!isTeacherRegister)}
                    className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                  >
                    {isTeacherRegister ? "Sudah punya akun? Masuk di sini" : "Belum punya akun guru? Daftar di sini"}
                  </button>
                </div>
              </form>
            )}

            {/* Parent Login Tab */}
            {activeRole === "parent" && (
              <form onSubmit={handleParentSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap Anak (Siswa)
                  </label>
                  <Input
                    placeholder="Nama anak sesuai data kelas"
                    value={parentChildName}
                    onChange={(e) => setParentChildName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Kelas Anak
                  </label>
                  <Input
                    placeholder="Contoh: KLS-7A"
                    value={parentClassCode}
                    onChange={(e) => setParentClassCode(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="emerald"
                  size="lg"
                  disabled={loading}
                  className="w-full mt-2 font-display"
                >
                  {loading ? "Memeriksa..." : "🌿 Pantau Perkembangan Anak"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 7 Habits Feature Badges */}
        <div className="mt-8 grid grid-cols-2 gap-2 text-center text-xs font-semibold sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs">
            <span className="text-lg block">🌅</span>
            <span className="text-slate-700">Bangun Pagi</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs">
            <span className="text-lg block">🙏</span>
            <span className="text-slate-700">Beribadah</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs">
            <span className="text-lg block">🏃</span>
            <span className="text-slate-700">Berolahraga</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs">
            <span className="text-lg block">🥗</span>
            <span className="text-slate-700">Makan Sehat</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs">
            <span className="text-lg block">📚</span>
            <span className="text-slate-700">Gemar Belajar</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs">
            <span className="text-lg block">🤝</span>
            <span className="text-slate-700">Bermasyarakat</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-xs col-span-2 sm:col-span-2">
            <span className="text-lg block">🌙</span>
            <span className="text-slate-700">Tidur Tepat Waktu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
