import React from "react";
import { Navigate } from "react-router-dom";
import { getTeacherToken, getStudentToken, getParentToken } from "../lib/api-client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: "teacher" | "student" | "parent";
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  if (role === "teacher") {
    if (!getTeacherToken()) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  if (role === "parent") {
    if (!getParentToken()) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  if (role === "student") {
    if (!getStudentToken()) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}
