import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Compass,
  Map,
  Camera,
  Ship,
  Trophy,
  ClipboardCheck,
  BarChart3,
  Award,
  Users,
  LogOut,
  Flame,
  Coins,
  Sparkles,
} from "lucide-react";
import { useStudentInfo, useStudentLogout, useTeacherInfo, useTeacherLogout, useParentInfo, useParentLogout } from "../hooks/use-auth";
import { useStudentDashboard } from "../hooks/use-students";
import { Button } from "./ui/Button";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const studentInfo = useStudentInfo();
  const teacherInfo = useTeacherInfo();
  const parentInfo = useParentInfo();

  const { logout: studentLogout } = useStudentLogout();
  const { logout: teacherLogout } = useTeacherLogout();
  const { logout: parentLogout } = useParentLogout();

  const studentId = studentInfo?.studentId ?? 0;
  const { data: dashboard } = useStudentDashboard(studentId);

  // Determine current active role from route
  const isStudent = location.pathname.startsWith("/student");
  const isTeacher = location.pathname.startsWith("/teacher");
  const isParent = location.pathname.startsWith("/parent");

  if (!isStudent && !isTeacher && !isParent) {
    return null;
  }

  const handleLogout = () => {
    if (isStudent) studentLogout();
    else if (isTeacher) teacherLogout();
    else if (isParent) parentLogout();
    navigate("/");
  };

  return (
    <>
      {/* Top Desktop & Tablet Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <Link to={isStudent ? "/student/map" : isTeacher ? "/teacher/feed" : "/parent/feed"} className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-400/30">
              <span className="text-xl">⛵</span>
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-sky-600">SAPTARA</span>
              <span className="hidden text-[10px] uppercase font-bold text-amber-500 tracking-widest sm:block">7 Kebiasaan Hebat</span>
            </div>
          </Link>

          {/* Student Status Bar (XP, Coins, Streak) */}
          {isStudent && (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Flame Streak */}
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-700 shadow-xs">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span>{dashboard?.streak ?? studentInfo ? 1 : 0} Hari</span>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200/80 px-3 py-1 text-xs font-bold text-sky-700 shadow-xs">
                <Sparkles className="h-4 w-4 text-sky-500" />
                <span>{dashboard?.student?.xp ?? 0} mil</span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200/80 px-3 py-1 text-xs font-bold text-yellow-700 shadow-xs">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>{dashboard?.student?.coins ?? 0}</span>
              </div>
            </div>
          )}

          {/* Teacher / Parent Info */}
          {isTeacher && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Guru:</span>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                👨‍🏫 {teacherInfo?.name || "Bapak/Ibu Guru"}
              </span>
            </div>
          )}

          {isParent && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Wali Murid dari:</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                {parentInfo?.studentAvatar || "🧒"} {parentInfo?.studentName || "Siswa"}
              </span>
            </div>
          )}

          {/* Desktop Nav Links & Logout */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>

        {/* Secondary Desktop Navigation Bar */}
        <div className="hidden border-t border-slate-100 bg-slate-50/50 sm:block">
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-1.5 sm:px-6">
            {isStudent && (
              <>
                <NavLink to="/student/map" icon={<Map className="h-4 w-4" />} label="Peta Samudra" currentPath={location.pathname} />
                <NavLink to="/student/logbook" icon={<Camera className="h-4 w-4" />} label="Jurnal Foto" currentPath={location.pathname} />
                <NavLink to="/student/compass" icon={<Compass className="h-4 w-4" />} label="Kompas Karakter" currentPath={location.pathname} />
                <NavLink to="/student/ship" icon={<Ship className="h-4 w-4" />} label="Kapalku" currentPath={location.pathname} />
                <NavLink to="/student/leaderboard" icon={<Trophy className="h-4 w-4" />} label="Papan Peringkat" currentPath={location.pathname} />
              </>
            )}

            {isTeacher && (
              <>
                <NavLink to="/teacher/feed" icon={<ClipboardCheck className="h-4 w-4" />} label="Beranda Jurnal" currentPath={location.pathname} />
                <NavLink to="/teacher/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analitik Kelas" currentPath={location.pathname} />
                <NavLink to="/teacher/rewards" icon={<Award className="h-4 w-4" />} label="Hadiah & Piagam" currentPath={location.pathname} />
                <NavLink to="/teacher/crew" icon={<Users className="h-4 w-4" />} label="Daftar Siswa" currentPath={location.pathname} />
              </>
            )}

            {isParent && (
              <>
                <NavLink to="/parent/feed" icon={<ClipboardCheck className="h-4 w-4" />} label="Jurnal Harian Anak" currentPath={location.pathname} />
                <NavLink to="/parent/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Pantauan & Perkembangan" currentPath={location.pathname} />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-around">
          {isStudent && (
            <>
              <MobileNavLink to="/student/map" icon={<Map className="h-5 w-5" />} label="Peta" currentPath={location.pathname} />
              <MobileNavLink to="/student/logbook" icon={<Camera className="h-5 w-5" />} label="Jurnal" currentPath={location.pathname} />
              <MobileNavLink to="/student/compass" icon={<Compass className="h-5 w-5" />} label="Kompas" currentPath={location.pathname} />
              <MobileNavLink to="/student/ship" icon={<Ship className="h-5 w-5" />} label="Kapal" currentPath={location.pathname} />
              <MobileNavLink to="/student/leaderboard" icon={<Trophy className="h-5 w-5" />} label="Peringkat" currentPath={location.pathname} />
            </>
          )}

          {isTeacher && (
            <>
              <MobileNavLink to="/teacher/feed" icon={<ClipboardCheck className="h-5 w-5" />} label="Verifikasi" currentPath={location.pathname} />
              <MobileNavLink to="/teacher/analytics" icon={<BarChart3 className="h-5 w-5" />} label="Analitik" currentPath={location.pathname} />
              <MobileNavLink to="/teacher/rewards" icon={<Award className="h-5 w-5" />} label="Hadiah" currentPath={location.pathname} />
              <MobileNavLink to="/teacher/crew" icon={<Users className="h-5 w-5" />} label="Siswa" currentPath={location.pathname} />
            </>
          )}

          {isParent && (
            <>
              <MobileNavLink to="/parent/feed" icon={<ClipboardCheck className="h-5 w-5" />} label="Jurnal" currentPath={location.pathname} />
              <MobileNavLink to="/parent/analytics" icon={<BarChart3 className="h-5 w-5" />} label="Perkembangan" currentPath={location.pathname} />
            </>
          )}
        </div>
      </nav>
    </>
  );
}

function NavLink({ to, icon, label, currentPath }: { to: string; icon: React.ReactNode; label: string; currentPath: string }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
        isActive
          ? "bg-sky-500 text-white shadow-xs"
          : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon, label, currentPath }: { to: string; icon: React.ReactNode; label: string; currentPath: string }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold transition-colors ${
        isActive ? "text-sky-600" : "text-slate-400 hover:text-slate-700"
      }`}
    >
      <div className={`rounded-xl p-1 ${isActive ? "bg-sky-50" : ""}`}>{icon}</div>
      <span>{label}</span>
    </Link>
  );
}
