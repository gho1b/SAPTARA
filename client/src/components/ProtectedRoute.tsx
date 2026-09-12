import { Navigate } from "react-router-dom";
import { useTeacherSession, useStudentInfo, useParentInfo } from "../hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: "teacher" | "student" | "parent";
}

/**
 * ProtectedRoute — gates access based on auth role.
 * - Teacher: checks Better Auth session via useSession()
 * - Student: checks JWT token presence in localStorage
 * - Parent: checks parent JWT token presence in localStorage
 */
export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  if (role === "teacher") {
    return <TeacherGuard>{children}</TeacherGuard>;
  }
  if (role === "parent") {
    return <ParentGuard>{children}</ParentGuard>;
  }
  return <StudentGuard>{children}</StudentGuard>;
}

function TeacherGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useTeacherSession();

  if (isPending) {
    return (
      <div className="landing-page" style={{ minHeight: "100vh" }}>
        <div style={{ fontSize: "64px", animation: "shipBob 3s ease-in-out infinite" }}>🧭</div>
        <h1 style={{ fontFamily: "'Fredoka One', sans-serif", color: "#FFB703", fontSize: "2rem", marginTop: "16px" }}>
          SAPTARA
        </h1>
        <p style={{ opacity: 0.6, fontSize: "13px", marginTop: "8px" }}>Memeriksa sesi...</p>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function StudentGuard({ children }: { children: React.ReactNode }) {
  const studentInfo = useStudentInfo();

  if (!studentInfo) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ParentGuard({ children }: { children: React.ReactNode }) {
  const parentInfo = useParentInfo();

  if (!parentInfo) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
