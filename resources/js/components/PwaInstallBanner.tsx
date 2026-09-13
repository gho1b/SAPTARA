import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("saptara_pwa_dismissed");
    if (isDismissed) {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("saptara_pwa_dismissed", "true");
  };

  if (!installPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="rounded-2xl border-2 border-sky-400 bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 p-4 text-white shadow-2xl shadow-sky-500/30 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-xl shrink-0 border border-white/30">
            📱
          </div>
          <div>
            <h4 className="font-display text-sm font-bold flex items-center gap-1.5">
              <span>Pasang SAPTARA di HP</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            </h4>
            <p className="text-[11px] text-sky-100 mt-0.5 leading-relaxed">
              Buka aplikasi langsung dari layar utama tanpa ketik alamat web lagi!
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs h-7 px-3 rounded-lg shadow-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Pasang Sekarang
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] text-sky-200 hover:text-white font-medium px-2 py-1"
              >
                Nanti saja
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
