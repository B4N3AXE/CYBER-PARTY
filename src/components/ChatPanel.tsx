import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import socket from '../socket';
import { MessageCircle } from 'lucide-react';

export default function ChatPanel({ chat, roomId }: { chat: ChatMessage[], roomId: string }) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat-message', { roomId, text });
    setText('');
  };

  return (
    <div className="glass-panel rounded-3xl p-4 shadow-2xl flex flex-col h-[320px] md:h-full max-h-[600px]">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neonPink"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">Parti Sohbeti</h3>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs custom-scrollbar">
        {chat.map(msg => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-center italic text-[11px] text-neonPink/80 my-2 px-4 py-1.5 rounded-full bg-neonPink/5 border border-neonPink/10 mx-auto w-fit">
                {msg.text}
              </div>
            );
          }
          const isMe = msg.senderName === chat.find(m => m.id === socket.id)?.senderName; // Roughly check if me, actually we don't have myName easily, but it's ok
          // Better logic for styling
          return (
            <div key={msg.id} className="bg-white/5 rounded-xl p-2 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] leading-none">{msg.senderAvatar}</span>
                  <span className="font-bold text-neonBlue">{msg.senderName}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-slate-300 ml-5">{msg.text}</p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="pt-2 border-t border-white/10 flex items-center gap-2 shrink-0">
        <input 
          type="text" 
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Bir şeyler yaz..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neonPurple transition-colors"
        />
        <button type="submit" className="p-2 rounded-xl bg-neonPink hover:bg-pink-600 text-white shadow-neon-pink transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
}
