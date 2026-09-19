import { Room } from '../types';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import LexisGame from './LexisGame';
import Cyber21Game from './Cyber21Game';
import CyberBombGame from './CyberBombGame';
import ChatPanel from './ChatPanel';
import socket from '../socket';

export default function RoomView({ room, myPlayerInfo }: { room: Room, myPlayerInfo: {name: string, avatar: string} }) {
  const myPlayer = room.players.find(p => p.id === socket.id);
  const isHost = myPlayer?.isHost;

  const activePlayer = room.players.find(p => p.id === room.questionerId || p.id === room.answererId) || room.players[0];

  if (room.phase === 'lobby') {
    return <Lobby room={room} myPlayer={myPlayer} />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-white/10 bg-[#0c121e]/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3.5 transition-all">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-neonPurple via-neonPink to-neonBlue flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white animate-pulse sm:w-7 sm:h-7"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              </div>
              <div>
                {room.settings?.gameMode === 'cyberbomb' ? (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-400">
                    CYBER<span className="text-pink-500">BOMB</span>
                  </span>
                ) : room.settings?.gameMode === 'cyber21' ? (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-300">
                    CYBER<span className="text-amber-400">21</span>
                  </span>
                ) : room.settings?.gameMode === 'lexis' ? (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                    CYBER<span className="text-cyan-400">LEXIS</span>
                  </span>
                ) : (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-300">
                    CYBER<span className="text-neonPink">SPIN</span>
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>PARTİ ODASI: <strong className="text-neonBlue tracking-wider">#{room.id}</strong></span>
                </div>
              </div>
            </div>
          </div>
          
          {room.phase !== 'game_over' && (
            <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-1.5 rounded-2xl">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Tur:</span>
                <span className="font-display font-bold text-sm text-neonBlue">{room.currentRound} / {room.settings.rounds}</span>
              </div>
              {activePlayer && room.settings?.gameMode !== 'cyber21' && room.settings?.gameMode !== 'cyberbomb' && (
                <>
                  <div className="h-4 w-[1px] bg-white/10"></div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Aktif Oyuncu:</span>
                    <span className="px-2 py-0.5 rounded-full bg-neonPurple/20 text-neonPurple border border-neonPurple/30 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neonPurple animate-pulse"></span>
                      {activePlayer.name} (Sıra Onda)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="relative">
                <div className="w-9 h-9 flex items-center justify-center text-xl rounded-full bg-gradient-to-br from-neonPink to-neonBlue p-0.5 shadow-neon-blue">
                  <div className="w-full h-full bg-darkBg rounded-full flex items-center justify-center">{myPlayerInfo.avatar}</div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-darkBg"></span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold leading-tight">{myPlayerInfo.name}</div>
                <div className="text-[10px] text-neonBlue font-mono">
                  {room.settings?.gameMode === 'cyberbomb'
                    ? `${(myPlayer?.rp || 1500).toLocaleString()} RP`
                    : room.settings?.gameMode === 'cyber21'
                    ? `${(myPlayer?.chips || 0).toLocaleString()} Çip`
                    : `${myPlayer?.score || 0} Puan`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Layout */}
      {room.settings?.gameMode === 'cyberbomb' ? (
        <main className="w-full flex-1 min-h-0 p-2 sm:p-3 lg:p-4 flex flex-col overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <CyberBombGame room={room} myPlayer={myPlayer} socket={socket} />
        </main>
      ) : room.settings?.gameMode === 'cyber21' ? (
        <main className="w-full flex-1 min-h-0 p-2 sm:p-3 lg:p-4 flex flex-col overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <Cyber21Game room={room} myPlayer={myPlayer} socket={socket} />
        </main>
      ) : (
        <main className="w-full flex-1 px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start min-h-0 overflow-y-auto xl:overflow-hidden custom-scrollbar" style={{ overflowAnchor: "none" }}>
          {/* Left Column: Lobi & Oyuncu Masası */}
        <section className="xl:col-span-3 flex flex-col gap-4 sm:gap-5 order-2 xl:order-1 min-w-0 h-full overflow-y-auto custom-scrollbar">
          <div className="glass-panel rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neonBlue"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-slate-200">Lobi Oyuncuları</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">{room.players.length}/10</span>
            </div>
            
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {room.players.map(p => {
                const isMe = p.id === socket.id;
                const isTurn = (room.phase !== 'lobby' && room.phase !== 'game_over') && (p.id === room.questionerId || p.id === room.answererId);
                
                return (
                  <div key={p.id} className={`glass-card p-2.5 rounded-2xl flex items-center justify-between transition-all ${isTurn ? 'border-neonPurple/50 bg-neonPurple/10 shadow-neon-purple/20' : isMe ? 'border-neonBlue/30 bg-neonBlue/5' : 'hover:border-white/20'}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isTurn ? 'ring-2 ring-neonPurple bg-darkBg' : isMe ? 'ring-1 ring-neonBlue bg-darkBg' : 'ring-1 ring-white/10 bg-darkBg'}`}>
                          {p.avatar}
                        </div>
                        {p.isHost && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-neonPink flex items-center justify-center text-[9px] font-bold text-white shadow-neon-pink z-10">👑</span>}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate max-w-[100px]">
                          {p.name}
                          {isTurn && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neonPurple text-white font-mono shrink-0">SIRA</span>}
                          {isMe && !isTurn && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neonBlue/20 text-neonBlue font-mono shrink-0">SEN</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isTurn ? <span className="text-neonPurple animate-pulse">Sıra Onda</span> : 'İzleyici'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${isTurn ? 'text-neonPurple' : isMe ? 'text-neonBlue' : 'text-slate-400'}`}>{p.score}p</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(room.id);
                  alert('Oda kodu kopyalandı: ' + room.id);
                }}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neonBlue"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Kodu Kopyala
              </button>
            </div>
          </div>
        </section>

        {/* Center Column: Cyber Table / GameBoard / Lobby Settings */}
        <section className="xl:col-span-6 flex flex-col items-center justify-center order-1 xl:order-2 min-w-0 h-full overflow-y-auto custom-scrollbar w-full">
          {room.settings?.gameMode === 'lexis' ? (
            <LexisGame room={room} myPlayer={myPlayer} socket={socket} />
          ) : (
            <GameBoard room={room} myPlayer={myPlayer} />
          )}
        </section>

        {/* Right Column: Liderlik Tablosu & Chat */}
        <section className="xl:col-span-3 flex flex-col gap-4 sm:gap-5 order-3 min-w-0 h-full overflow-y-auto custom-scrollbar">
          <div className="glass-panel rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-slate-200">Liderlik Tablosu</h2>
              </div>
              <span className="text-[11px] text-neonPink font-semibold">Canlı Sıralama</span>
            </div>
            <div className="space-y-2">
              {[...room.players].sort((a,b) => b.score - a.score).slice(0, 4).map((p, idx) => {
                const isMe = p.id === socket.id;
                let bgClass = "bg-slate-400/10 border-white/10";
                let badgeClass = "bg-slate-300 text-darkBg";
                if(idx === 0) { bgClass = "bg-amber-500/10 border-amber-500/20"; badgeClass = "bg-amber-400 text-darkBg"; }
                if(idx === 1) { bgClass = "bg-slate-300/10 border-slate-300/20"; badgeClass = "bg-slate-200 text-darkBg"; }
                if(idx === 2) { bgClass = "bg-amber-700/10 border-amber-700/20"; badgeClass = "bg-amber-600 text-white"; }
                if(isMe && idx > 2) { bgClass = "bg-neonBlue/10 border-neonBlue/30"; badgeClass = "bg-neonBlue text-darkBg"; }
                
                return (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded-xl border ${bgClass}`}>
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${badgeClass}`}>{idx + 1}</span>
                      <span className={`text-xs font-bold truncate ${isMe ? 'text-neonBlue' : 'text-slate-200'}`}>{p.name}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold shrink-0 ml-2 ${idx === 0 ? 'text-amber-300' : isMe ? 'text-neonBlue' : 'text-slate-300'}`}>{p.score} pt</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <ChatPanel chat={room.chat} roomId={room.id} />
        </section>
        </main>
      )}
    </div>
  );
}
