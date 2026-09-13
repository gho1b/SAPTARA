import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { adminService } from "../../services/admin.service";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const stored = adminService.getStoredUser();
    if (stored) {
      setAdminUser(stored);
      setChecking(false);
    } else {
      adminService
        .me()
        .then((res) => {
          setAdminUser(res.user);
          setChecking(false);
        })
        .catch(() => {
          adminService.logout();
          navigate("/admin/login", { replace: true });
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    adminService.logout();
    navigate("/admin/login", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Memverifikasi Otoritas Super Admin...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      to: "/admin/dashboard",
      label: "Dashboard Ringkasan",
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: location.pathname === "/admin/dashboard",
    },
    {
      to: "/admin/schools",
      label: "Master Data Sekolah",
      icon: <Building2 className="h-4 w-4" />,
      active: location.pathname.startsWith("/admin/schools"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <Link to="/admin/dashboard" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                  ⚓
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-sm tracking-wide text-white">
                      SAPTARA
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/30 uppercase tracking-widest">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Pusat Kendali Tenant Multi-Sekolah</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Info & Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/"
                target="_blank"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Buka Halaman Utama Saptara"
              >
                <span>Halaman Utama</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <div className="h-4 w-px bg-slate-800" />

              <div className="text-right">
                <span className="block text-xs font-bold text-slate-200">
                  {adminUser?.name || "Administrator"}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">
                  {adminUser?.email || "admin@saptara.id"}
                </span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="gap-1.5 text-xs text-rose-300 border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
            <div className="pb-2 mb-2 border-b border-slate-800">
              <span className="block text-xs font-bold text-slate-200">
                {adminUser?.name || "Administrator"}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {adminUser?.email || "admin@saptara.id"}
              </span>
            </div>

            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  item.active
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <Link
                to="/"
                target="_blank"
                className="text-xs text-slate-400 flex items-center gap-1"
              >
                <span>Halaman Utama</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="gap-1 text-xs text-rose-300 border-rose-900/60"
              >
                <LogOut className="h-3 w-3" />
                <span>Keluar</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          SAPTARA Administrator Backoffice © {new Date().getFullYear()} — Multi-Tenant School Management Platform
        </div>
      </footer>
    </div>
  );
}

