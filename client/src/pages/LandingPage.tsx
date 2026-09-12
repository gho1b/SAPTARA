import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTeacherSession,
  useTeacherSignIn,
  useTeacherSignUp,
  useCreateTeacherProfile,
  useStudentLogin,
  useStudentInfo,
  useParentLogin,
  useParentInfo,
} from "../hooks/use-auth";

type AuthMode = "select" | "teacher-login" | "teacher-register" | "student-login" | "parent-login";

/**
 * Landing Page
 *
 * Two entry paths:
 * - Laksamana (Teacher): sign up/in via Better Auth
 * - Kapten Cilik (Student): login via name + class code
 */
export function LandingPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = useTeacherSession();
  const studentInfo = useStudentInfo();
  const parentInfo = useParentInfo();
  const [mode, setMode] = useState<AuthMode>("select");

  // Redirect if already logged in — use useEffect to avoid calling navigate() during render
  useEffect(() => {
    if (!sessionPending && session?.user) {
      navigate("/teacher/feed", { replace: true });
    } else if (studentInfo) {
      navigate("/student/map", { replace: true });
    } else if (parentInfo) {
      navigate("/parent/feed", { replace: true });
    }
  }, [sessionPending, session?.user, studentInfo, parentInfo, navigate]);

  // Show nothing while redirecting
  if ((!sessionPending && session?.user) || studentInfo || parentInfo) {
    return null;
  }

  return (
    <div className="landing-page" id="landing-page">
      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-hero__compass" style={{ fontSize: "72px", animation: "shipBob 3s ease-in-out infinite" }}>
          🧭
        </div>
        <h1 className="landing-hero__title">SAPTARA</h1>
        <p className="landing-hero__subtitle">Sapta Karakter Anak Nusantara</p>
        <p className="landing-hero__tagline">⚓ Ekspedisi Tujuh Samudra ⚓</p>
      </div>

      {/* Auth modes */}
      {mode === "select" && (
        <div className="landing-auth">
          <div className="landing-auth__cards">
            <button
              className="role-card teacher-card"
              onClick={() => setMode("teacher-login")}
              type="button"
              id="btn-teacher-entry"
            >
              <span className="role-card__icon">🧑‍✈️</span>
              <span className="role-card__title">Laksamana</span>
              <span className="role-card__desc">Masuk sebagai Guru</span>
            </button>

            <button
              className="role-card student-card"
              onClick={() => setMode("student-login")}
              type="button"
              id="btn-student-entry"
            >
              <span className="role-card__icon">🧒</span>
              <span className="role-card__title">Kapten Cilik</span>
              <span className="role-card__desc">Masuk sebagai Murid</span>
            </button>

            <button
              className="role-card parent-card"
              onClick={() => setMode("parent-login")}
              type="button"
              id="btn-parent-entry"
            >
              <span className="role-card__icon">👨‍👩‍👦</span>
              <span className="role-card__title">Penjaga Kompas</span>
              <span className="role-card__desc">Masuk sebagai Orang Tua</span>
            </button>
          </div>
        </div>
      )}

      {mode === "teacher-login" && (
        <TeacherLoginForm
          onBack={() => setMode("select")}
          onRegister={() => setMode("teacher-register")}
        />
      )}

      {mode === "teacher-register" && (
        <TeacherRegisterForm
          onBack={() => setMode("teacher-login")}
        />
      )}

      {mode === "student-login" && (
        <StudentLoginForm onBack={() => setMode("select")} />
      )}

      {mode === "parent-login" && (
        <ParentLoginForm onBack={() => setMode("select")} />
      )}

      {/* Footer */}
      <div className="landing-footer">
        <p>🌊 Jelajahi 7 samudra, bangun 7 kebiasaan baik! 🌊</p>
      </div>

      {/* Help Desk — floating icon pojok kanan atas */}
      <a
        href="https://s.id/FULLSAPTARA"
        target="_blank"
        rel="noopener noreferrer"
        className="helpdesk-fab"
        aria-label="Help Desk SAPTARA"
        title="Help Desk SAPTARA"
      >
        🛟
        <span className="helpdesk-fab__tooltip">bantuan disini</span>
      </a>
    </div>
  );
}

// ── Teacher Login Form ──

function TeacherLoginForm({
  onBack,
  onRegister,
}: {
  onBack: () => void;
  onRegister: () => void;
}) {
  const navigate = useNavigate();
  const signIn = useTeacherSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn.mutateAsync({ email, password });
      navigate("/teacher/feed");
    } catch {
      // error is available via signIn.error
    }
  };

  return (
    <div className="auth-form">
      <button className="btn-back" onClick={onBack} type="button">← Kembali</button>
      <h2>🧑‍✈️ Masuk sebagai Laksamana</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="teacher-email">Email</label>
          <input
            id="teacher-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="laksamana@sekolah.id"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="teacher-password">Password</label>
          <input
            id="teacher-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={signIn.isPending}>
          {signIn.isPending ? "Memproses..." : "⚓ Masuk"}
        </button>
        {signIn.isError && (
          <p className="error-text">❌ {signIn.error.message}</p>
        )}
      </form>
      <p className="auth-switch">
        Belum punya akun?{" "}
        <button onClick={onRegister} type="button" className="link-btn">
          Daftar di sini
        </button>
      </p>
    </div>
  );
}

// ── Teacher Register Form ──

function TeacherRegisterForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const signUp = useTeacherSignUp();
  const createProfile = useCreateTeacherProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp.mutateAsync({ email, password, name });
      // Create teacher profile
      await createProfile.mutateAsync(name);
      navigate("/teacher/feed");
    } catch {
      // error is available via signUp.error
    }
  };

  return (
    <div className="auth-form">
      <button className="btn-back" onClick={onBack} type="button">← Kembali</button>
      <h2>🧑‍✈️ Daftar sebagai Laksamana</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-name">Nama Lengkap</label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bu Sari"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="laksamana@sekolah.id"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            minLength={8}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={signUp.isPending || createProfile.isPending}
        >
          {signUp.isPending || createProfile.isPending ? "Mendaftar..." : "🚀 Daftar"}
        </button>
        {signUp.isError && (
          <p className="error-text">❌ {signUp.error.message}</p>
        )}
        {createProfile.isError && (
          <p className="error-text">❌ {createProfile.error.message}</p>
        )}
      </form>
    </div>
  );
}

// ── Student Login Form ──

function StudentLoginForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const studentLogin = useStudentLogin();
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studentLogin.mutateAsync({ name, classCode });
      navigate("/student/map");
    } catch {
      // error is available via studentLogin.error
    }
  };

  return (
    <div className="auth-form">
      <button className="btn-back" onClick={onBack} type="button">← Kembali</button>
      <h2>🧒 Masuk sebagai Kapten Cilik</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="student-name">Nama Kapten</label>
          <input
            id="student-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arya Pratama"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="student-code">Kode Kapal (Kelas)</label>
          <input
            id="student-code"
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="4A"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={studentLogin.isPending}>
          {studentLogin.isPending ? "Memproses..." : "⛵ Naik Kapal!"}
        </button>
        {studentLogin.isError && (
          <p className="error-text">❌ {studentLogin.error.message}</p>
        )}
      </form>
    </div>
  );
}

// ── Parent Login Form ──

function ParentLoginForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const parentLogin = useParentLogin();
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await parentLogin.mutateAsync({ name, classCode });
      navigate("/parent/feed");
    } catch {
      // error available via parentLogin.error
    }
  };

  return (
    <div className="auth-form">
      <button className="btn-back" onClick={onBack} type="button">← Kembali</button>
      <h2>👨‍👩‍👦 Masuk sebagai Penjaga Kompas</h2>
      <p style={{ opacity: 0.7, fontSize: "13px", marginBottom: "16px" }}>
        Masukkan nama anak dan kode kelas yang diberikan guru
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="parent-child-name">Nama Anak</label>
          <input
            id="parent-child-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arya Pratama"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="parent-class-code">Kode Kelas</label>
          <input
            id="parent-class-code"
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="4A"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={parentLogin.isPending}>
          {parentLogin.isPending ? "Memproses..." : "🏠 Masuk sebagai Penjaga Kompas"}
        </button>
        {parentLogin.isError && (
          <p className="error-text">❌ {(parentLogin.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
