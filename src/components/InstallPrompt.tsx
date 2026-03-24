"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Cek apakah sudah diinstall
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }

    // Cek apakah sudah pernah dismiss dalam 7 hari terakhir
    const lastDismiss = localStorage.getItem("pwa-install-dismissed");
    if (lastDismiss && Date.now() - parseInt(lastDismiss) < 7 * 24 * 60 * 60 * 1000) return;

    // iOS check
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    if (ios) {
      // Tampilkan setelah 3 detik di iOS
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome — gunakan beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setShow(false);
    setDismissed(true);
  };

  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden">
            {/* Header gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* App icon mini */}
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <rect x="6" y="14" width="28" height="20" rx="5" fill="white" opacity="0.95" />
                    <path d="M14 14V11C14 9.343 15.343 8 17 8H23C24.657 8 26 9.343 26 11V14"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
                    <circle cx="20" cy="24" r="2.5" fill="#2563EB" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">PKL SMK HASSINA</p>
                  <p className="text-[10px] text-blue-200 leading-tight">Tambahkan ke layar utama</p>
                </div>
              </div>
              <button onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              {isIOS ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Instal aplikasi ini di iPhone kamu:
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Share className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span>Tap tombol <strong>Bagikan</strong> di bawah</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span>Pilih <strong>"Tambah ke Layar Utama"</strong></span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600 flex-1">
                    Akses lebih cepat tanpa buka browser. Instal gratis!
                  </p>
                  <button onClick={handleInstall}
                    className="flex-shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                    <Download className="w-3.5 h-3.5" />
                    Instal
                  </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Gratis · Tanpa iklan · Bekerja offline
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
