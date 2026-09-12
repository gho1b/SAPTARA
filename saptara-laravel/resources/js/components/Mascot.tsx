import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";

const MASCOT_TIPS = [
  { mascot: "kaka", text: "Halo Kapten! Jangan lupa makan makanan sehat agar energimu penuh untuk berlayar! 🥬" },
  { mascot: "kaka", text: "Wah, cuaca cerah hari ini! Yuk selesaikan 7 kebiasaan hebatmu! ☀️" },
  { mascot: "momo", text: "Semangat Kapten! Momo bangga padamu! Terus berbuat baik! 💪" },
  { mascot: "kaka", text: "Ada harta karun di Pulau Cerdas! Sudah membaca buku dan belajar hari ini? 📖" },
  { mascot: "momo", text: "Momo sudah berolahraga pagi ini! Kapten juga dong! 🏃" },
  { mascot: "kaka", text: "Ingat ya Kapten, tidur tepat waktu malam ini agar esok bangun dengan bugar! 🌙" },
  { mascot: "momo", text: "Terima kasih sudah ramah dan membantu sesama teman! Kamu luar biasa! 🤗" },
  { mascot: "kaka", text: "Ayo kita arungi samudra kebiasaan baik bersama-sama! 🗺️" },
];

export function Mascot() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(MASCOT_TIPS[0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTip(MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)]);
      setIsVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNewTip = () => {
    const next = MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)];
    setCurrentTip(next);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => {
          handleNewTip();
          setIsVisible(true);
        }}
        type="button"
        title="Panggil Sahabat Laut Si Kaka"
        className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-2xl shadow-lg shadow-amber-400/30 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white sm:bottom-6 sm:right-6"
      >
        🐢
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-30 flex items-end gap-2 sm:bottom-6 sm:right-6 animate-in slide-in-from-bottom-5">
      {/* Speech Bubble */}
      <div className="relative max-w-xs rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
            {currentTip.mascot === "kaka" ? "🐢 Si Kaka Bijak" : "🐙 Si Momo Ceria"}
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs font-medium text-slate-700 leading-relaxed mt-1">{currentTip.text}</p>
        <div className="mt-2.5 flex justify-end">
          <button
            onClick={handleNewTip}
            className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-600 hover:bg-sky-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            <span>Pesan Lain</span>
          </button>
        </div>
      </div>

      {/* Mascot Avatar */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-amber-300 text-3xl shadow-lg border-2 border-white animate-bounce">
        {currentTip.mascot === "kaka" ? "🐢" : "🐙"}
      </div>
    </div>
  );
}
