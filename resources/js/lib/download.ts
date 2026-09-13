import { getTeacherToken, getStudentToken, getParentToken } from "./api-client";

/**
 * Utility helper untuk mengunduh file biner (PDF, Excel, CSV) dengan Header Authorization Bearer
 */
export async function downloadAuthorizedFile(url: string, fallbackFileName: string) {
  const token =
    getTeacherToken() ||
    getStudentToken() ||
    getParentToken() ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Gagal mengunduh berkas: Status ${response.status}`);
  }

  // Coba ambil nama file dari header Content-Disposition jika ada
  let fileName = fallbackFileName;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      fileName = match[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}
