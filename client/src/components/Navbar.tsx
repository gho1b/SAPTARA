import { useLocation, useNavigate } from "react-router-dom";

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

const studentNav: NavItem[] = [
  { icon: "🗺️", label: "Peta", route: "/student/map" },
  { icon: "📸", label: "Logbook", route: "/student/logbook" },
  { icon: "🧭", label: "Kompas", route: "/student/compass" },
  { icon: "⛵", label: "Kapal", route: "/student/ship" },
  { icon: "🏆", label: "Papan", route: "/student/leaderboard" },
];

const teacherNav: NavItem[] = [
  { icon: "📋", label: "Feed", route: "/teacher/feed" },
  { icon: "📊", label: "Analitik", route: "/teacher/analytics" },
  { icon: "🏅", label: "Reward", route: "/teacher/rewards" },
  { icon: "👥", label: "Kru", route: "/teacher/crew" },
];

const parentNav: NavItem[] = [
  { icon: "📋", label: "Feed", route: "/parent/feed" },
  { icon: "📊", label: "Analitik", route: "/parent/analytics" },
];

interface NavbarProps {
  role: "student" | "teacher" | "parent";
}

/**
 * Bottom Navigation Bar
 *
 * Renders the maritime-themed bottom nav for student, teacher, or parent role.
 * Highlights the active route.
 */
export function Navbar({ role }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const items =
    role === "student" ? studentNav :
    role === "parent"  ? parentNav  :
    teacherNav;

  return (
    <nav className="bottom-nav" id={`nav-${role}`}>
      {items.map((item) => (
        <button
          key={item.route}
          className={`nav-item ${location.pathname === item.route ? "active" : ""}`}
          data-route={item.route}
          onClick={() => navigate(item.route)}
          type="button"
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
