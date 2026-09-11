
import React, { useState } from 'react';
import { Room, Player } from '../types';
import socket from '../socket';
import Wheel from './Wheel';
import { TRUTH_QUESTIONS, DARE_QUESTIONS } from '../data/questions';

export default function GameBoard({ room, myPlayer }: { room: Room, myPlayer?: Player }) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  
  const questioner = room.players.find(p => p.id === room.questionerId);
  const answerer = room.players.find(p => p.id === room.answererId);
  
  const isQuestioner = myPlayer?.id === room.questionerId;
  const isAnswerer = myPlayer?.id === room.answererId;
  const isSpectator = !isQuestioner && !isAnswerer;

  const handleTypeSelect = (type: 'truth' | 'dare') => {
    socket.emit('choose_type', { roomId: room.id, type });
  };

  const handleRandomQuestion = () => {
    const list = room.selectedType === 'truth' ? TRUTH_QUESTIONS : DARE_QUESTIONS;
    const randomQ = list[Math.floor(Math.random() * list.length)];
    socket.emit('submit_question', { roomId: room.id, question: randomQ });
  };

  const handleSelectPoolQuestion = (q: string) => {
    socket.emit('submit_question', { roomId: room.id, question: q });
    setShowQuestionModal(false);
  };

  const handleCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    socket.emit('submit_question', { roomId: room.id, question: customQuestion });
    setCustomQuestion('');
  };

  const handleAnswer = () => {
    if (!answer.trim()) return;
    socket.emit('answer_truth', { roomId: room.id, answer });
    setAnswer('');
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        socket.emit('upload_proof', { roomId: room.id, mediaUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVote = (vote: 'approve' | 'reject') => {
    socket.emit('vote_proof', { roomId: room.id, vote });
  };

  const handleJoker = (joker: 'pass' | 'change') => {
    socket.emit('use_joker', { roomId: room.id, joker });
  };

  const handleBet = (bet: 'truth' | 'dare') => {
    socket.emit('place_bet', { roomId: room.id, bet });
  };

  let phaseTitle = '';
  let phaseContent = null;
  let targetSpun = null;

  switch(room.phase) {
    case 'spin_questioner':
      phaseTitle = 'Soru Soracak Kişi Seçiliyor...';
      targetSpun = room.questionerId;
      break;
    case 'spin_answerer':
      phaseTitle = 'Cevaplayacak Kişi Seçiliyor...';
      targetSpun = room.answererId;
      break;
    case 'choose_type':
      phaseTitle = `${answerer?.name} Seçim Yapıyor`;
      if (isAnswerer) {
        phaseContent = (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-xl mx-auto w-full">
            <button onClick={() => handleTypeSelect('truth')} className="glass-card p-6 rounded-2xl border-white/10 hover:border-neonBlue/60 hover:bg-neonBlue/5 cursor-pointer group transition-all duration-300 hover:-translate-y-1 flex-1 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-neonBlue/20 text-neonBlue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-neon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-1">DOĞRULUK</h4>
              <p className="text-xs text-slate-400 mb-3 text-center">Sırlarını bizimle paylaşmaya hazır mısın?</p>
            </button>
            <button onClick={() => handleTypeSelect('dare')} className="glass-card p-6 rounded-2xl border-white/10 hover:border-neonPink/60 hover:bg-neonPink/5 cursor-pointer group transition-all duration-300 hover:-translate-y-1 flex-1 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-neonPink/20 text-neonPink flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-neon-pink">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-1">CESARET</h4>
              <p className="text-xs text-slate-400 mb-3 text-center">En çılgın görevlere göğüs gerebilir misin?</p>
            </button>
          </div>
        );
      } else {
        phaseContent = (
          <div className="text-center glass-panel p-6 rounded-3xl w-full max-w-md mx-auto">
            <p className="text-slate-300 mb-4 font-medium">Sence ne seçecek? Tahmin et, puan kazan!</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => handleBet('truth')} 
                disabled={room.bets[myPlayer?.id || ''] !== undefined}
                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${room.bets[myPlayer?.id || ''] === 'truth' ? 'bg-neonBlue/20 border-neonBlue shadow-neon-blue text-neonBlue' : 'border-white/10 hover:bg-white/5 text-slate-400 hover:text-white'}`}
              >
                Doğruluk
              </button>
              <button 
                onClick={() => handleBet('dare')} 
                disabled={room.bets[myPlayer?.id || ''] !== undefined}
                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${room.bets[myPlayer?.id || ''] === 'dare' ? 'bg-neonPink/20 border-neonPink shadow-neon-pink text-neonPink' : 'border-white/10 hover:bg-white/5 text-slate-400 hover:text-white'}`}
              >
                Cesaret
              </button>
            </div>
          </div>
        );
      }
      break;
    case 'ask_question':
      phaseTitle = `${questioner?.name}, ${answerer?.name}'a Soruyor`;
      if (isQuestioner) {
        phaseContent = (
          <div className="space-y-4 max-w-md mx-auto glass-panel p-6 rounded-3xl w-full">
            <div className="flex gap-3">
              <button onClick={handleRandomQuestion} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-slate-200 text-sm md:text-base transition-colors">
                Rastgele Seç
              </button>
              <button onClick={() => setShowQuestionModal(true)} className="flex-1 py-3 bg-gradient-to-r from-neonPurple to-neonViolet hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-neon-purple text-sm md:text-base transition-all">
                Depodan Seç
              </button>
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-semibold uppercase">veya kendin yaz</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={customQuestion} 
                onChange={e => setCustomQuestion(e.target.value)} 
                placeholder="Kendi sorunu/görevini yaz..." 
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neonPurple text-white text-sm transition-colors"
              />
              <button onClick={handleCustomQuestion} className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]">Sor</button>
            </div>
          </div>
        );
      } else {
        phaseContent = <p className="text-center text-slate-400 animate-pulse glass-card px-6 py-3 rounded-full border border-white/10 max-w-xs mx-auto">Soru/Görev bekleniyor...</p>;
      }
      break;
    case 'wait_answer':
      phaseTitle = `${answerer?.name} cevaplıyor...`;
      phaseContent = (
        <div className="text-center space-y-6 max-w-xl mx-auto w-full">
          <div className="glass-panel p-6 rounded-3xl border border-neonBlue/30 text-lg font-medium shadow-neon-blue/20">
             <span className="text-neonBlue font-bold block mb-2">{questioner?.name} soruyor:</span>
             <span className="text-white">"{room.question}"</span>
          </div>
          
          {isAnswerer ? (
            <div className="space-y-3">
              <input 
                type="text" 
                value={answer} 
                onChange={e => setAnswer(e.target.value)} 
                placeholder="Cevabını yaz..." 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neonBlue text-white text-sm"
              />
              <button onClick={handleAnswer} className="w-full py-3 bg-gradient-to-r from-neonBlue to-cyan-400 rounded-xl font-bold text-white shadow-neon-blue hover:scale-[1.02] active:scale-[0.98] transition-all">Gönder</button>
            </div>
          ) : (
            <p className="text-center text-slate-400 italic">Cevap yazıyor...</p>
          )}
        </div>
      );
      break;
    case 'dare_proof':
      phaseTitle = 'Görev Bekleniyor!';
      phaseContent = (
        <div className="text-center space-y-6 max-w-xl mx-auto w-full">
          <div className="glass-panel p-6 rounded-3xl border border-neonPink/30 text-lg font-medium shadow-neon-pink/20">
             <span className="text-neonPink font-bold block mb-2">{questioner?.name}'ın görevi:</span>
             <span className="text-white">"{room.question}"</span>
          </div>

          {isAnswerer ? (
            <div className="glass-card p-6 rounded-2xl border-white/10 border-dashed">
              <p className="text-slate-300 mb-4">Görevi yaptığını kanıtlamak için fotoğraf yükle:</p>
              <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleProofUpload}
                 className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-neonPink/20 file:text-neonPink hover:file:bg-neonPink/30 transition-colors"
              />
            </div>
          ) : (
            <p className="text-center text-slate-400 italic">Kanıt yüklemesi bekleniyor...</p>
          )}
        </div>
      );
      break;
    case 'dare_vote':
      phaseTitle = 'Görev Onay Oylaması';
      phaseContent = (
        <div className="text-center space-y-6 max-w-md mx-auto w-full">
          {room.proofMedia && (
            <button onClick={() => setShowProofModal(true)} className="relative w-full aspect-video flex justify-center bg-black/40 p-2 rounded-2xl border border-white/10 shadow-lg overflow-hidden group cursor-pointer hover:border-white/30 transition-colors">
               <img src={room.proofMedia} alt="Kanıt" className="w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                 <span className="text-white font-bold flex items-center gap-2 bg-darkBg/80 px-4 py-2 rounded-full border border-white/20"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg> Büyüt</span>
               </div>
            </button>
          )}
          
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl">
             <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
             </div>
             <p className="text-white text-lg mb-6 font-medium">{answerer?.name} bu görevi başarıyla yerine getirdi mi?</p>
             {isSpectator || isQuestioner ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleVote('approve')}
                    disabled={room.votes[myPlayer?.id || ''] !== undefined}
                    className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${room.votes[myPlayer?.id || ''] === 'approve' ? 'bg-emerald-500/40 border border-emerald-500/60 text-emerald-300 scale-105' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:scale-105'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg> ONAYLA
                  </button>
                  <button 
                    onClick={() => handleVote('reject')}
                    disabled={room.votes[myPlayer?.id || ''] !== undefined}
                    className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${room.votes[myPlayer?.id || ''] === 'reject' ? 'bg-rose-500/40 border border-rose-500/60 text-rose-300 scale-105' : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:scale-105'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg> REDDET
                  </button>
                </div>
             ) : (
                <p className="text-slate-400 italic bg-white/5 py-3 rounded-xl border border-white/10">Diğer oyuncuların kararı bekleniyor...</p>
             )}
          </div>
        </div>
      );
      break;
    case 'round_end':
      phaseTitle = 'Tur Özeti';
      
      const isReady = room.readyForNextRound?.includes(myPlayer?.id || '');
      const readyCount = room.readyForNextRound?.length || 0;
      const totalCount = room.players.length;

      let summaryContent = null;
      if (room.selectedType === 'truth') {
        summaryContent = (
          <div className="glass-panel p-6 rounded-3xl border border-neonBlue/30 text-center shadow-neon-blue/20">
             <span className="text-neonBlue font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} DOĞRUYU SÖYLEDİ</span>
             <p className="text-white text-lg italic mb-4">"{room.answerText}"</p>
             <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                +10 PUAN
             </div>
          </div>
        );
      } else if (room.selectedType === 'dare') {
        if (room.dareResult === 'passed') {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 text-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
               <span className="text-amber-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} PAS GEÇTİ</span>
               <p className="text-slate-300 mb-4">Bu görevi yapmaya cesaret edemedi!</p>
               <div className="inline-block bg-slate-500/10 border border-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                  0 PUAN
               </div>
            </div>
          );
        } else if (room.dareResult === 'approved') {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 text-center shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col items-center">
               <span className="text-emerald-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} GÖREVİ BAŞARDI</span>
               {room.proofMedia && (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg">
                    <img src={room.proofMedia} alt="Kanıt" className="w-full h-auto object-cover max-h-48" />
                  </div>
               )}
               <p className="text-white mb-4">Topluluk bu cesareti takdir etti!</p>
               <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                  +25 PUAN
               </div>
            </div>
          );
        } else {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 text-center shadow-[0_0_15px_rgba(244,63,94,0.15)] flex flex-col items-center">
               <span className="text-rose-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} GÖREVİ BAŞARAMADI</span>
               {room.proofMedia && (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg opacity-80 grayscale">
                    <img src={room.proofMedia} alt="Kanıt" className="w-full h-auto object-cover max-h-48" />
                  </div>
               )}
               <p className="text-white mb-4">Topluluk sunulan kanıtı yetersiz buldu!</p>
               <div className="inline-block bg-slate-500/10 border border-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                  0 PUAN
               </div>
            </div>
          );
        }
      }

      phaseContent = (
        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full">
           {summaryContent}
           
           <div className="w-full flex flex-col gap-2 mt-4">
             <button
               onClick={() => socket.emit('ready_next_round', { roomId: room.id })}
               disabled={isReady}
               className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isReady ? 'bg-white/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-default' : 'bg-gradient-to-r from-neonPurple to-neonPink text-white hover:scale-105 shadow-neon-pink'}`}
             >
               {isReady ? 'Bekleniyor...' : 'Hazırım!'}
             </button>
             <p className="text-center text-sm font-medium text-slate-400 mt-2">
               Sonraki tur için: <span className={readyCount === totalCount ? 'text-emerald-400' : 'text-white'}>{readyCount} / {totalCount}</span> Oyuncu Hazır
             </p>
           </div>
        </div>
      );
      break;
    case 'game_over':
      phaseTitle = 'Oyun Bitti! 🎉';
      
      const sortedPlayers = [...room.players].sort((a,b) => b.score - a.score);
      const winner = sortedPlayers[0];
      const second = sortedPlayers[1];
      const third = sortedPlayers[2];

      phaseContent = (
        <div className="text-center space-y-8 max-w-4xl mx-auto w-full pt-8">
           <div className="flex justify-center items-end gap-2 md:gap-6 h-64 md:h-80 mb-12">
              {/* 2nd Place */}
              {second && (
                <div className="flex flex-col items-center animate-[slide-up_1s_ease-out]">
                   <span className="text-4xl md:text-5xl mb-2 drop-shadow-md">{second.avatar}</span>
                   <div className="bg-slate-300/10 backdrop-blur-sm border border-slate-300/20 w-24 md:w-32 h-32 md:h-40 rounded-t-2xl flex flex-col justify-start pt-4 relative">
                      <span className="text-4xl font-display font-black text-slate-300 opacity-50">2</span>
                      <span className="font-bold text-white text-sm mt-2 px-1 truncate w-full">{second.name}</span>
                      <span className="text-neonPurple font-bold text-xs">{second.score}P</span>
                   </div>
                </div>
              )}
              {/* 1st Place */}
              {winner && (
                <div className="flex flex-col items-center animate-[slide-up_0.8s_ease-out] z-10">
                   <span className="text-5xl md:text-6xl mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">{winner.avatar}</span>
                   <div className="bg-amber-400/20 backdrop-blur-md border border-amber-400/40 w-28 md:w-40 h-40 md:h-52 rounded-t-3xl flex flex-col justify-start pt-4 relative shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                      <span className="text-5xl font-display font-black text-amber-400 opacity-60">1</span>
                      <span className="font-bold text-white mt-2 px-1 truncate w-full">{winner.name}</span>
                      <span className="text-amber-400 font-bold">{winner.score}P</span>
                   </div>
                </div>
              )}
              {/* 3rd Place */}
              {third && (
                <div className="flex flex-col items-center animate-[slide-up_1.2s_ease-out]">
                   <span className="text-3xl md:text-4xl mb-2 drop-shadow-md">{third.avatar}</span>
                   <div className="bg-amber-700/10 backdrop-blur-sm border border-amber-700/20 w-24 md:w-32 h-24 md:h-32 rounded-t-2xl flex flex-col justify-start pt-4 relative">
                      <span className="text-4xl font-display font-black text-amber-600 opacity-50">3</span>
                      <span className="font-bold text-white text-sm mt-2 px-1 truncate w-full">{third.name}</span>
                      <span className="text-neonPurple font-bold text-xs">{third.score}P</span>
                   </div>
                </div>
              )}
           </div>

           {myPlayer?.isHost && (
             <button 
               onClick={() => socket.emit('return_to_lobby', { roomId: room.id })}
               className="px-10 py-4 bg-gradient-to-r from-neonPurple to-neonPink hover:opacity-90 rounded-2xl font-bold text-xl shadow-neon-pink transition-all transform hover:scale-105"
             >
               Lobiye Dön ve Yeni Oyun Başlat
             </button>
           )}
           {!myPlayer?.isHost && (
             <p className="text-slate-400 text-lg animate-pulse glass-card inline-block px-6 py-3 rounded-full">Kurucunun lobiye dönmesi bekleniyor...</p>
           )}
        </div>
      );
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative p-2 md:p-6">
      
      {/* Joker UI - Now positioned like a widget top right of center col */}
      {myPlayer && room.phase !== 'game_over' && room.phase !== 'lobby' && (
        <div className="absolute top-0 right-0 flex gap-2 z-30 opacity-70 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleJoker('pass')}
            disabled={myPlayer.jokers.pass === 0 || room.phase.startsWith('spin') || !isAnswerer}
            className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${myPlayer.jokers.pass > 0 && isAnswerer && !room.phase.startsWith('spin') ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'}`}
            title="Pas Geç (Sadece cevaplayan)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            Pas ({myPlayer.jokers.pass})
          </button>
          <button 
            onClick={() => handleJoker('change')}
            disabled={myPlayer.jokers.changeQuestion === 0 || room.phase.startsWith('spin') || (!isAnswerer && !isQuestioner)}
            className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${myPlayer.jokers.changeQuestion > 0 && (isAnswerer || isQuestioner) && !room.phase.startsWith('spin') ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'}`}
            title="Soru Değiştir (Soran/Cevaplayan)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Değiştir ({myPlayer.jokers.changeQuestion})
          </button>
        </div>
      )}

      {room.phase !== 'game_over' && (
        <Wheel players={room.players} spinningTo={targetSpun} phase={room.phase} />
      )}

      {/* Action Controls & Status Bar */}
      <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-lg z-20 shrink-0">
        <h2 className="font-display font-bold text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 text-center leading-tight mb-2">
          {phaseTitle}
        </h2>
        
        <div className="w-full">
           {phaseContent}
        </div>
      </div>

      {/* Question Pool Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className="glass-panel border-white/20 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl relative animate-float">
             <div className="flex justify-between items-center p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-neonPurple/20 border border-neonPurple/40 text-neonPurple text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Soru Deposu
                  </span>
                </div>
                <button 
                  onClick={() => setShowQuestionModal(false)} 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
             
             <div className="px-6 py-4 border-b border-white/10">
               <h3 className="font-display font-bold text-2xl text-white">
                  {room.selectedType === 'truth' ? 'Doğruluk Soruları' : 'Cesaret Görevleri'}
               </h3>
               <p className="text-slate-400 text-sm mt-1">Aşağıdaki listeden bir soru veya görev seç.</p>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {(room.selectedType === 'truth' ? TRUTH_QUESTIONS : DARE_QUESTIONS).map((q, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSelectPoolQuestion(q)} 
                    className="w-full text-left p-4 glass-card hover:bg-white/5 border-white/10 hover:border-neonPurple/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-2xl transition-all text-sm md:text-base text-slate-200 group flex items-start gap-3"
                  >
                     <span className="text-neonPurple font-mono font-bold opacity-50 group-hover:opacity-100 transition-opacity mt-0.5">{(idx + 1).toString().padStart(2, '0')}</span>
                     <span>{q}</span>
                  </button>
                ))}
             </div>
           </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {showProofModal && room.proofMedia && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/20 shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neonPink/20 text-neonPink flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">Yüklenen Görev Kanıtı</h3>
                  <p className="text-xs text-slate-400">{answerer?.name} tarafından yüklendi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProofModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="relative w-full h-[50vh] sm:h-[60vh] rounded-2xl overflow-hidden border border-white/15 bg-black/40 flex items-center justify-center">
              <img src={room.proofMedia} alt="Party Evidence" className="max-w-full max-h-full object-contain" />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-darkBg/80 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg> 
                Orijinal Kanıt Fotoğrafı
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-end">
              <button 
                onClick={() => setShowProofModal(false)}
                className="px-6 py-2.5 rounded-xl bg-neonPurple hover:bg-purple-600 text-white font-bold text-xs tracking-wider"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
