import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { schoolAdminService } from "../../services/school-admin.service";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Ship,
  Users,
  HeartHandshake,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

export function SchoolAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!schoolAdminService.isAuthenticated()) {
      navigate("/school-admin/login", { replace: true });
      return;
    }

    const storedUser = schoolAdminService.getStoredUser();
    const storedSchool = schoolAdminService.getStoredSchool();

    if (storedUser && storedSchool) {
      setAdminUser(storedUser);
      setSchool(storedSchool);
      setChecking(false);
    } else {
      schoolAdminService
        .me()
        .then((res) => {
          setAdminUser(res.user);
          setSchool(res.school);
          setChecking(false);
        })
        .catch(() => {
          schoolAdminService.logout();
          navigate("/school-admin/login", { replace: true });
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    schoolAdminService.logout();
    navigate("/school-admin/login", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Memverifikasi Otoritas Admin Sekolah...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      to: "/school-admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: location.pathname === "/school-admin/dashboard",
    },
    {
      to: "/school-admin/teachers",
      label: "Dewan Guru",
      icon: <GraduationCap className="h-4 w-4" />,
      active: location.pathname.startsWith("/school-admin/teachers"),
    },
    {
      to: "/school-admin/classes",
      label: "Rombel & Kelas",
      icon: <Ship className="h-4 w-4" />,
      active: location.pathname.startsWith("/school-admin/classes"),
    },
    {
      to: "/school-admin/students",
      label: "Awak Siswa",
      icon: <Users className="h-4 w-4" />,
      active: location.pathname.startsWith("/school-admin/students"),
    },
    {
      to: "/school-admin/parents",
      label: "Wali Murid",
      icon: <HeartHandshake className="h-4 w-4" />,
      active: location.pathname.startsWith("/school-admin/parents"),
    },
    {
      to: "/school-admin/profile",
      label: "Profil Sekolah",
      icon: <Building2 className="h-4 w-4" />,
      active: location.pathname.startsWith("/school-admin/profile"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & School Context */}
            <div className="flex items-center gap-3">
              <Link to="/school-admin/dashboard" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                  🏫
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-sm tracking-wide text-white">
                      SAPTARA
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase tracking-widest">
                      Admin Sekolah
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                    {school?.name || "Sekolah"}
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    link.active
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* User & Actions */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right border-r border-slate-800 pr-3">
                <span className="text-xs font-bold text-slate-200 block">
                  {adminUser?.name || "Admin Sekolah"}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {adminUser?.email || ""}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-300 hover:text-rose-400 hover:bg-slate-800 gap-1.5 text-xs h-8"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <div className="flex items-center md:hidden gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
            <div className="p-2 mb-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <p className="font-bold text-white">{adminUser?.name}</p>
              <p className="text-[11px] text-slate-400">{school?.name}</p>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  link.active
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-800 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-rose-400 hover:bg-slate-800 gap-2 text-xs"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar Sesi</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SAPTARA — Modul Operasional Admin Sekolah ({school?.name || "Sekolah"})</span>
          <span className="text-[11px] font-mono">NPSN: {school?.npsn || "-"}</span>
        </div>
      </footer>
    </div>
  );
}

