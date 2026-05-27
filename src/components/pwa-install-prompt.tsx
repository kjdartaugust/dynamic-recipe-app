"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently (7 days)
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
    setIsVisible(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Install ZeroWaste Chef</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add to your home screen for quick access and offline cooking
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 btn-gradient text-white rounded-lg text-xs font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs text-muted-foreground hover:bg-orange-50 rounded-lg transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
