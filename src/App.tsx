/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Home from './components/Home';
import RoomView from './components/RoomView';
import { Room } from './types';
import socket from './socket';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [playerInfo, setPlayerInfo] = useState<{name: string, avatar: string} | null>(null);

  useEffect(() => {
    socket.on('room_update', (data: Room) => {
      setRoomData(data);
    });

    socket.on('chat-message', (msg: any) => {
      setRoomData(prev => {
        if (!prev) return prev;
        if (prev.chat.find(c => c.id === msg.id)) return prev;
        return {
          ...prev,
          chat: [...prev.chat, msg].slice(-50)
        };
      });
    });

    return () => {
      socket.off('room_update');
      socket.off('chat-message');
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#060813]" style={{
        backgroundImage: 'radial-gradient(ellipse 90% 70% at 50% -20%, rgba(168, 85, 247, 0.22), transparent 70%), radial-gradient(ellipse 60% 50% at 85% 90%, rgba(6, 182, 212, 0.18), transparent 70%), radial-gradient(ellipse 50% 40% at 15% 85%, rgba(236, 72, 153, 0.16), transparent 70%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="fixed inset-0 cyber-grid-floor pointer-events-none z-0"></div>
        <div className="fixed inset-0 scanlines pointer-events-none z-10 opacity-35"></div>
        {/* Glowing Plasma Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute -bottom-20 right-10 w-[420px] h-[420px] bg-cyan-500/15 rounded-full blur-[110px] pointer-events-none z-0"></div>
        <div className="absolute -top-10 left-10 w-[380px] h-[380px] bg-pink-500/15 rounded-full blur-[100px] pointer-events-none z-0"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen font-sans">
        {(!roomId || !roomData) ? (
          <Home 
            onJoin={(id, name, avatar) => {
              setRoomId(id);
              setPlayerInfo({name, avatar});
            }} 
          />
        ) : (
          <RoomView room={roomData} myPlayerInfo={playerInfo} />
        )}
      </div>
    </>
  );
}
