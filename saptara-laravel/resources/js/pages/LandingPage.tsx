import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import { schoolService } from "../services/school.service";
import type { School } from "../types";
import { useStudentInfo, useTeacherInfo, useParentInfo } from "../hooks/use-auth";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Tabs } from "../components/ui/Tabs";
import { SchoolSelectCombobox } from "../components/SchoolSelectCombobox";
import { Sparkles, Ship, GraduationCap, HeartHandshake, Compass, ArrowRight, CheckCircle2, AlertCircle, KeyRound, UserCheck } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const studentInfo = useStudentInfo();
  const teacherInfo = useTeacherInfo();
  const parentInfo = useParentInfo();

  const [activeRole, setActiveRole] = useState<string>("student");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // School Multi-Tenant State
  const [selectedSchool, setSelectedSchool] = useState<School | null>(() => schoolService.getStoredSchool());

  // Student Form
  const [studentNis, setStudentNis] = useState("");
  const [studentAccessCode, setStudentAccessCode] = useState("");

  // Teacher Form
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherPasswordConfirm, setTeacherPasswordConfirm] = useState("");
  const [isTeacherRegister, setIsTeacherRegister] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  // Parent Form
  const [parentAuthMode, setParentAuthMode] = useState<"quick" | "account">("quick");
  const [isParentRegister, setIsParentRegister] = useState(false);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentPasswordConfirm, setParentPasswordConfirm] = useState("");
  const [parentChildNis, setParentChildNis] = useState("");
  const [parentChildAccessCode, setParentChildAccessCode] = useState("");

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
    if (!selectedSchool) {
      setErrorMsg("Harap pilih sekolah asal terlebih dahulu di atas");
      return;
    }
    if (!studentNis.trim() || !studentAccessCode.trim()) {
      setErrorMsg("Harap masukkan NIS dan Kode PIN Siswa");
      return;
    }

    setLoading(true);
    try {
      await authService.studentLogin({
        schoolId: selectedSchool.id,
        nis: studentNis.trim(),
        accessCode: studentAccessCode.trim(),
      });
      navigate("/student/map");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk sebagai siswa. Periksa NIS & Kode PIN Anda.");
    } finally {
      setLoading(false);
    }
  };

  // Teacher Login/Register Handler
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!teacherEmail.trim() || !teacherPassword) {
      setErrorMsg("Harap isi email dan password");
      return;
    }

    setLoading(true);
    try {
      if (isTeacherRegister) {
        if (!selectedSchool) {
          setErrorMsg("Harap tentukan sekolah tempat Anda bertugas di bagian atas");
          setLoading(false);
          return;
        }
        if (!teacherName.trim()) {
          setErrorMsg("Harap masukkan nama lengkap guru");
          setLoading(false);
          return;
        }
        if (teacherPassword.length < 8) {
          setErrorMsg("Password minimal 8 karakter");
          setLoading(false);
          return;
        }
        if (teacherPassword !== teacherPasswordConfirm) {
          setErrorMsg("Konfirmasi password tidak cocok");
          setLoading(false);
          return;
        }
        await authService.teacherRegister(
          teacherName.trim(),
          teacherEmail.trim(),
          teacherPassword,
          teacherPasswordConfirm,
          teacherName.trim(),
          selectedSchool.id
        );
      } else {
        await authService.teacherLogin(teacherEmail.trim(), teacherPassword);
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

    setLoading(true);
    try {
      if (parentAuthMode === "quick") {
        if (!selectedSchool) {
          setErrorMsg("Harap pilih sekolah asal terlebih dahulu di atas");
          setLoading(false);
          return;
        }
        if (!parentChildNis.trim() || !parentChildAccessCode.trim()) {
          setErrorMsg("Harap masukkan NIS dan Kode PIN Siswa (Anak)");
          setLoading(false);
          return;
        }
        await authService.parentLogin({
          schoolId: selectedSchool.id,
          nis: parentChildNis.trim(),
          accessCode: parentChildAccessCode.trim(),
        });
      } else {
        if (!parentEmail.trim() || !parentPassword.trim()) {
          setErrorMsg("Harap masukkan email dan password");
          setLoading(false);
          return;
        }

        if (isParentRegister) {
          if (!parentName.trim()) {
            setErrorMsg("Harap masukkan nama lengkap Anda sebagai orang tua");
            setLoading(false);
            return;
          }
          if (parentPassword.length < 6) {
            setErrorMsg("Password minimal 6 karakter");
            setLoading(false);
            return;
          }
          if (parentPassword !== parentPasswordConfirm) {
            setErrorMsg("Konfirmasi password tidak cocok");
            setLoading(false);
            return;
          }
          await authService.parentRegister({
            name: parentName.trim(),
            email: parentEmail.trim(),
            password: parentPassword,
            passwordConfirmation: parentPasswordConfirm,
          });
        } else {
          await authService.parentLoginWithEmail(parentEmail.trim(), parentPassword);
        }
      }

      navigate("/parent/feed");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk wali murid. Periksa kembali data Anda.");
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
            {/* Step 1: School Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Pilih Sekolah Asal
              </label>
              <SchoolSelectCombobox
                selectedSchool={selectedSchool}
                onSelectSchool={(school) => {
                  setSelectedSchool(school);
                  setErrorMsg(null);
                }}
              />
            </div>

            {/* Step 2: Role Tabs */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Pilih Peran & Masuk
              </label>
              <Tabs
                activeTab={activeRole}
                onChange={(id) => {
                  setActiveRole(id);
                  setErrorMsg(null);
                  setTeacherPasswordConfirm("");
                  setParentPasswordConfirm("");
                }}
                tabs={[
                  { id: "student", label: "Siswa", icon: <Ship className="h-4 w-4" /> },
                  { id: "teacher", label: "Guru", icon: <GraduationCap className="h-4 w-4" /> },
                  { id: "parent", label: "Orang Tua", icon: <HeartHandshake className="h-4 w-4" /> },
                ]}
              />
            </div>

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
                    Nomor Induk Siswa (NIS)
                  </label>
                  <Input
                    placeholder="Contoh: 10482 / 20240101"
                    value={studentNis}
                    onChange={(e) => setStudentNis(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode PIN Siswa (6 Digit)
                  </label>
                  <Input
                    type="password"
                    placeholder="Contoh: 849201"
                    value={studentAccessCode}
                    onChange={(e) => setStudentAccessCode(e.target.value)}
                    maxLength={20}
                    className="font-mono tracking-widest text-center text-base"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-amber-500 shrink-0 inline" />
                    <span>Kode PIN rahasia dibagikan oleh Guru Kelas Anda.</span>
                  </p>
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
                  <>
                    <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800">
                      <p className="font-semibold flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                        Pendaftaran Guru untuk Sekolah:
                      </p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedSchool ? selectedSchool.name : "⚠️ Harap pilih sekolah terlebih dahulu di atas"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nama Lengkap Guru
                      </label>
                      <Input
                        placeholder="Nama Lengkap & Gelar"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        required
                      />
                    </div>
                  </>
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password {isTeacherRegister && <span className="text-slate-400 font-normal lowercase">(min. 8 karakter)</span>}
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    required
                  />
                </div>
                {isTeacherRegister && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Konfirmasi Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Ulangi password"
                      value={teacherPasswordConfirm}
                      onChange={(e) => setTeacherPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>
                )}
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
                    onClick={() => {
                      setIsTeacherRegister(!isTeacherRegister);
                      setTeacherPasswordConfirm("");
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                  >
                    {isTeacherRegister ? "Sudah punya akun? Masuk di sini" : "Belum punya akun guru? Daftar di sini"}
                  </button>
                </div>
              </form>
            )}

            {/* Parent Login Tab */}
            {activeRole === "parent" && (
              <div className="space-y-4 pt-1">
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setParentAuthMode("quick");
                      setErrorMsg(null);
                    }}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      parentAuthMode === "quick"
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ⚡ Akses Cepat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParentAuthMode("account");
                      setErrorMsg(null);
                    }}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      parentAuthMode === "account"
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ✉️ Akun Multi-Anak
                  </button>
                </div>

                <form onSubmit={handleParentSubmit} className="space-y-3">
                  {parentAuthMode === "quick" ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Nomor Induk Siswa (NIS Anak)
                        </label>
                        <Input
                          placeholder="Contoh: 10482 / 20240101"
                          value={parentChildNis}
                          onChange={(e) => setParentChildNis(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kode PIN Siswa (6 Digit)
                        </label>
                        <Input
                          type="password"
                          placeholder="Contoh: 849201"
                          value={parentChildAccessCode}
                          onChange={(e) => setParentChildAccessCode(e.target.value)}
                          maxLength={20}
                          className="font-mono tracking-widest text-center text-base"
                          required
                        />
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <KeyRound className="h-3 w-3 text-emerald-600 shrink-0 inline" />
                          <span>Gunakan kode PIN siswa yang tertera pada kartu siswa anak.</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {isParentRegister && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nama Lengkap Orang Tua
                          </label>
                          <Input
                            placeholder="Bapak / Ibu Budi Santoso"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Email Orang Tua
                        </label>
                        <Input
                          type="email"
                          placeholder="orangtua@example.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={parentPassword}
                          onChange={(e) => setParentPassword(e.target.value)}
                          required
                        />
                      </div>

                      {isParentRegister && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Konfirmasi Password
                          </label>
                          <Input
                            type="password"
                            placeholder="Ulangi password"
                            value={parentPasswordConfirm}
                            onChange={(e) => setParentPasswordConfirm(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {isParentRegister && (
                        <div className="pt-2 border-t border-slate-100 space-y-2.5">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Hubungkan Anak Pertama (Opsional):
                          </span>
                          <div>
                            <Input
                              placeholder="Nama lengkap anak"
                              value={parentChildName}
                              onChange={(e) => setParentChildName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Kode kelas anak (Contoh: KLS-7A)"
                              value={parentClassCode}
                              onChange={(e) => setParentClassCode(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsParentRegister(!isParentRegister);
                            setParentPasswordConfirm("");
                            setErrorMsg(null);
                          }}
                          className="text-xs text-emerald-700 hover:underline font-semibold"
                        >
                          {isParentRegister
                            ? "Sudah punya akun? Masuk di sini"
                            : "Belum punya akun? Daftar akun orang tua baru"}
                        </button>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="emerald"
                    size="lg"
                    disabled={loading}
                    className="w-full mt-2 font-display"
                  >
                    {loading
                      ? "Memproses..."
                      : isParentRegister && parentAuthMode === "account"
                      ? "Daftar Akun Wali Murid"
                      : "🌿 Masuk Pantauan Anak"}
                  </Button>
                </form>
              </div>
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

        {/* Admin Backoffice Portal Footer Link */}
        <div className="mt-8 text-center text-xs">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 font-medium transition-colors"
          >
            <span>⚓ Portal Administrator Platform</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
