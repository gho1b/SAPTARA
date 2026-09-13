import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PwaInstallBanner } from "./components/PwaInstallBanner";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { MapPage } from "./pages/student/MapPage";
import { LogbookPage } from "./pages/student/LogbookPage";
import { CompassPage } from "./pages/student/CompassPage";
import { ShipPage } from "./pages/student/ShipPage";
import { LeaderboardPage } from "./pages/student/LeaderboardPage";

import { FeedPage } from "./pages/teacher/FeedPage";
import { AnalyticsPage } from "./pages/teacher/AnalyticsPage";
import { RewardsPage } from "./pages/teacher/RewardsPage";
import { CrewPage } from "./pages/teacher/CrewPage";

import { ParentFeedPage } from "./pages/parent/ParentFeedPage";
import { ParentAnalyticsPage } from "./pages/parent/ParentAnalyticsPage";

import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminSchoolListPage } from "./pages/admin/AdminSchoolListPage";

import { SchoolAdminLoginPage } from "./pages/school-admin/SchoolAdminLoginPage";
import { SchoolAdminLayout } from "./pages/school-admin/SchoolAdminLayout";
import { SchoolAdminDashboardPage } from "./pages/school-admin/SchoolAdminDashboardPage";
import { SchoolAdminTeachersPage } from "./pages/school-admin/SchoolAdminTeachersPage";
import { SchoolAdminClassesPage } from "./pages/school-admin/SchoolAdminClassesPage";
import { SchoolAdminStudentsPage } from "./pages/school-admin/SchoolAdminStudentsPage";
import { SchoolAdminParentsPage } from "./pages/school-admin/SchoolAdminParentsPage";
import { SchoolAdminProfilePage } from "./pages/school-admin/SchoolAdminProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Landing & Login */}
              <Route path="/" element={<LandingPage />} />

              {/* ── Student Routes ── */}
              <Route
                path="/student/map"
                element={
                  <ProtectedRoute role="student">
                    <MapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/logbook"
                element={
                  <ProtectedRoute role="student">
                    <LogbookPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/compass"
                element={
                  <ProtectedRoute role="student">
                    <CompassPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/ship"
                element={
                  <ProtectedRoute role="student">
                    <ShipPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/leaderboard"
                element={
                  <ProtectedRoute role="student">
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />

              {/* ── Teacher Routes ── */}
              <Route
                path="/teacher/feed"
                element={
                  <ProtectedRoute role="teacher">
                    <FeedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/analytics"
                element={
                  <ProtectedRoute role="teacher">
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/rewards"
                element={
                  <ProtectedRoute role="teacher">
                    <RewardsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/crew"
                element={
                  <ProtectedRoute role="teacher">
                    <CrewPage />
                  </ProtectedRoute>
                }
              />

              {/* ── Parent Routes ── */}
              <Route
                path="/parent/feed"
                element={
                  <ProtectedRoute role="parent">
                    <ParentFeedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/analytics"
                element={
                  <ProtectedRoute role="parent">
                    <ParentAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* ── Super Admin Routes ── */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="schools" element={<AdminSchoolListPage />} />
              </Route>

              {/* ── School Admin (Operator Sekolah) Routes ── */}
              <Route path="/school-admin/login" element={<SchoolAdminLoginPage />} />
              <Route path="/school-admin" element={<SchoolAdminLayout />}>
                <Route index element={<Navigate to="/school-admin/dashboard" replace />} />
                <Route path="dashboard" element={<SchoolAdminDashboardPage />} />
                <Route path="teachers" element={<SchoolAdminTeachersPage />} />
                <Route path="classes" element={<SchoolAdminClassesPage />} />
                <Route path="students" element={<SchoolAdminStudentsPage />} />
                <Route path="parents" element={<SchoolAdminParentsPage />} />
                <Route path="profile" element={<SchoolAdminProfilePage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <PwaInstallBanner />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
