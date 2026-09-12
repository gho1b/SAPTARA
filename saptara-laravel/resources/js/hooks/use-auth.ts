import { useState, useEffect } from "react";
import {
  getStoredStudentInfo,
  getStudentToken,
  removeStudentToken,
  getTeacherInfo,
  getTeacherToken,
  removeTeacherToken,
  getStoredParentInfo,
  getParentToken,
  removeParentToken,
} from "../lib/api-client";

export function useStudentInfo() {
  const [info, setInfo] = useState(() => getStoredStudentInfo());

  useEffect(() => {
    const check = () => setInfo(getStoredStudentInfo());
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  return info;
}

export function useStudentLogout() {
  return {
    logout: () => {
      removeStudentToken();
      window.location.href = "/";
    },
  };
}

export function useTeacherInfo() {
  const [info, setInfo] = useState(() => getTeacherInfo());

  useEffect(() => {
    const check = () => setInfo(getTeacherInfo());
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  return info;
}

export function useTeacherLogout() {
  return {
    logout: () => {
      removeTeacherToken();
      window.location.href = "/";
    },
  };
}

export function useParentInfo() {
  const [info, setInfo] = useState(() => getStoredParentInfo());

  useEffect(() => {
    const check = () => setInfo(getStoredParentInfo());
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  return info;
}

export function useParentLogout() {
  return {
    logout: () => {
      removeParentToken();
      window.location.href = "/";
    },
  };
}

export function useAuthRole(): "student" | "teacher" | "parent" | null {
  if (getTeacherToken()) return "teacher";
  if (getStudentToken()) return "student";
  if (getParentToken()) return "parent";
  return null;
}
