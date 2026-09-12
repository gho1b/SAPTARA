import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "../css/app.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// ── PWA Service Worker Registration ──
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("SAPTARA PWA Service Worker terdaftar:", reg.scope);
      })
      .catch((err) => {
        console.warn("Gagal mendaftarkan Service Worker:", err);
      });
  });
}
