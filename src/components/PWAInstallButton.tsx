import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 hover:from-pink-500 hover:to-cyan-400 text-cyan-300 hover:text-slate-950 border border-cyan-400/30 text-xs font-mono font-bold tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(0,240,255,0.2)] cursor-pointer"
        title="CyberParty uygulamasını yükle"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">UYGULAMAYI YÜKLE</span>
        <span className="md:hidden">YÜKLE</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 border border-white/10 text-xs font-mono font-bold tracking-wider transition cursor-pointer"
          title="Ana Ekrana Ekle"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">ANA EKRANA EKLE</span>
          <span className="md:hidden">EKLE</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#0c1224] p-6 border border-cyan-500/30 shadow-[0_0_35px_rgba(0,240,255,0.25)] text-left relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/favicon-48x48.png" 
                  alt="CyberParty Logo" 
                  className="w-10 h-10 rounded-xl border border-cyan-400/40"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-base font-display font-black text-white uppercase tracking-wider">
                    CYBERPARTY YÜKLE
                  </h3>
                  <p className="text-xs text-cyan-300 font-mono">iPhone / iPad Kurulumu</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-900/80 p-4 rounded-2xl border border-white/5 font-sans leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-pink-400 bg-pink-950/40 px-1.5 py-0.5 rounded text-[11px]">1</span>
                  <span>Safari alt menüsündeki <strong className="text-white flex items-center gap-1 inline-flex"><Share className="w-3 h-3 text-cyan-400" /> Paylaş</strong> simgesine dokunun.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded text-[11px]">2</span>
                  <span>Aşağı kaydırıp <strong className="text-white">"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded text-[11px]">3</span>
                  <span>Sağ üstteki <strong className="text-white">"Ekle"</strong> butonuna basarak CyberParty'i tam ekran uygulama olarak başlatın!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider transition"
              >
                ANLADIM
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
