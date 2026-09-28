import React from 'react';
import { OkeyPenalty, OkeyGameVariant } from '../../../types/okey';
import { AlertOctagon, ShieldAlert, Award, FileText, Info } from 'lucide-react';

interface OkeyPenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: OkeyGameVariant;
  penaltyHistory?: OkeyPenalty[];
}

export const OkeyPenaltyModal: React.FC<OkeyPenaltyModalProps> = ({
  isOpen,
  onClose,
  variant,
  penaltyHistory = [],
}) => {
  if (!isOpen) return null;

  const is101 = variant === '101';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0e1320] border-2 border-red-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                {is101 ? '101 Okey Resmi Ceza Listesi' : 'Klasik Okey Resmi Ceza Listesi'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {is101 ? '101 Katlamalı / Standart Ceza Puanları' : 'Klasik Masa Düşüm & İhlal Puanları'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-4 space-y-4">
          {/* Rulebook Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {is101 ? (
              <>
                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-red-400 font-display uppercase">Yere Yanlış Taş İşleme</span>
                    <span className="font-mono text-xs font-black text-red-400 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40">+101 Ceza</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Açılmış perlere uymayan veya joker/taş kuralını ihlal ederek yanlış taş işleyen oyuncuya yazılır.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-red-400 font-display uppercase">İşlekten Çekip Açamama</span>
                    <span className="font-mono text-xs font-black text-red-400 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40">+101 Ceza</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Yandaki oyuncunun attığı işlek taşı alıp aynı tur elini açamayan veya per yapamayan oyuncuya uygulanır.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-400 font-display uppercase">El Açamadan Bitiş</span>
                    <span className="font-mono text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">+202 Ceza</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Biri eli bitirdiğinde hiç el açamamış oyuncuların hanesine katlamalı 202 ceza puanı eklenir.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-purple-400 font-display uppercase">Okey Atarak Bitme</span>
                    <span className="font-mono text-xs font-black text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40">2x Katlama</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Biten oyuncu son taşı OKEY atarsa, diğer tüm oyuncuların el puanları ve cezaları ikiye katlanır.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-cyan-400 font-display uppercase">Çiftten Açma &amp; Bitme Kuralı</span>
                    <span className="font-mono text-xs font-black text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">5 Çift</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Çifte giden oyuncu en az 5 çift ile elini açabilir. Çiftten bitişte rakiplerin cezaları 2 katı olarak hesaplanır.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-red-400 font-display uppercase">Gösterge Cezası</span>
                    <span className="font-mono text-xs font-black text-red-400 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40">-20 Puan</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    İlk tur taş çekmeden önce gösterge taşı elinde olan oyuncu bildirirse +20 alır; rakipler ceza hanesine düşer.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-red-400 font-display uppercase">Yere İşlek Taş Atma</span>
                    <span className="font-mono text-xs font-black text-red-400 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40">-50 Puan</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Rakiplerin işine yarayacak işlek veya kilit taşı dikkatsizce yere atan oyuncuya yazılır.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-purple-400 font-display uppercase">Okey Atarak Bitme</span>
                    <span className="font-mono text-xs font-black text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40">4x Düşüm</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Okey atarak bitildiğinde standart 2 puan düşümü yerine 4 puan düşümü gerçekleşir.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-cyan-400 font-display uppercase">Çiftten Bitme</span>
                    <span className="font-mono text-xs font-black text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">4x Düşüm</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    7 çift toplayarak biten oyuncu, rakiplerinden standartın 2 katı puan düşürür.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Real-time Game Penalty History Log */}
          <div className="mt-4">
            <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Masa Ceza Kayıtları &amp; İhlaller ({penaltyHistory.length})</span>
            </h4>
            <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
              {penaltyHistory.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-slate-400">
                  Şu an bu masada kayıtlı kural ihlali veya ceza bulunmuyor. Temiz oyun!
                </div>
              ) : (
                penaltyHistory.map(pen => (
                  <div
                    key={pen.id}
                    className="p-2.5 rounded-xl bg-surface-container-high border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>@{pen.playerName}</span>
                        <span className="text-[10px] font-mono text-red-400">
                          {pen.points > 0 ? `+${pen.points}` : pen.points} Puan
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{pen.reason}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(pen.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            ANLADIM / KAPAT
          </button>
        </div>
      </div>
    </div>
  );
};
