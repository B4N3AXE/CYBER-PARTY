const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

const returnRegex = /return \([\s\S]*?\);\n\}/m;

const newReturn = `return (
    <div 
      id="cyberSketchContainer" 
      style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '16px', width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden', background: '#0b0f19', padding: '16px', boxSizing: 'border-box', color: '#fff' }}
    >
        
        {/* SOL SÜTUN: Liderlik Tablosu */}
        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h3 style={{ color: '#00f3ff', fontSize: '14px', marginBottom: '12px', letterSpacing: '1px' }}>LİDERLİK TABLOSU</h3>
            <div id="playerList" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...room.players].sort((a,b) => b.score - a.score).map((p, idx) => {
                    const isMe = p.id === socket.id;
                    const isDrawingPlayer = p.id === room.sketchDrawerId;
                    const didGuess = room.sketchCorrectGuesserIds?.includes(p.id);
                    return (
                        <div key={p.id} style={{ padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: isDrawingPlayer ? 'rgba(0, 243, 255, 0.2)' : didGuess ? 'rgba(0, 255, 102, 0.2)' : 'rgba(255,255,255,0.05)', border: isDrawingPlayer ? '1px solid rgba(0, 243, 255, 0.4)' : didGuess ? '1px solid rgba(0, 255, 102, 0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#94a3b8' }}>#{idx + 1}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: isMe ? '#fff' : '#cbd5e1' }}>{p.name}</span>
                                </div>
                                {isDrawingPlayer && <span style={{ fontSize: '12px' }}>🖌️</span>}
                                {didGuess && <span style={{ fontSize: '12px' }}>✅</span>}
                            </div>
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#00f3ff', fontWeight: 'bold' }}>{p.score} P</div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* ORTA SÜTUN: Tuval ve Araç Çubuğu Alanı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            {/* Üst Bilgi (Tur & Kelime İpucu) */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(0, 243, 255, 0.2)', padding: '10px 16px', borderRadius: '8px' }}>
                <span id="roundInfo" style={{ fontSize: '13px', color: '#94a3b8' }}>Tur {room.currentRound}/{room.settings.rounds}</span>
                {isDrawer ? (
                  <span id="wordHint" style={{ fontSize: '16px', fontWeight: 'bold', color: '#00f3ff', letterSpacing: '2px' }}>{room.sketchWord}</span>
                ) : (
                  <span id="wordHint" style={{ fontSize: '16px', fontWeight: 'bold', color: '#00f3ff', letterSpacing: '2px' }}>{hints?.join(' ')}</span>
                )}
                <span id="timerClock" style={{ fontSize: '14px', color: '#ff007f', fontWeight: 'bold' }}>{timeLeft} sn</span>
            </div>

            {/* Geniş Tuval (Canvas Alanı) */}
            <div ref={containerRef} style={{ flex: 1, width: '100%', background: '#050811', border: '2px solid rgba(0, 243, 255, 0.4)', borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 0 20px rgba(0, 243, 255, 0.1)' }}>
                {!isDrawer && !isDrawing.current && (
                  <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, padding: '4px 12px', borderRadius: '999px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#00f3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    İzleniyor...
                  </div>
                )}
                <canvas 
                  ref={canvasRef}
                  id="cyberCanvas" 
                  style={{ width: '100%', height: '100%', display: 'block', cursor: isDrawer ? 'crosshair' : 'default', touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                ></canvas>
            </div>

            {/* Alt Araç Çubuğu ve Kaydırmalı Neon Palet */}
            {isDrawer && (
              <div style={{ width: '100%', background: 'rgba(18, 24, 38, 0.8)', border: '1px solid rgba(0, 243, 255, 0.2)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  
                  {/* Fırça / Silgi Araçları */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        id="brushTool" 
                        onClick={(e) => { e.preventDefault(); setTool('brush'); }}
                        style={{ background: tool === 'brush' ? '#00f3ff' : '#1e293b', border: tool === 'brush' ? 'none' : '1px solid #334155', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: tool === 'brush' ? '#0b0f19' : 'inherit' }}
                      >✏️</button>
                      <button 
                        id="eraserTool" 
                        onClick={(e) => { e.preventDefault(); setTool('eraser'); }}
                        style={{ background: tool === 'eraser' ? '#00f3ff' : '#1e293b', border: tool === 'eraser' ? 'none' : '1px solid #334155', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool === 'eraser' ? '#0b0f19' : 'inherit' }}
                      >🧹</button>
                      <button 
                        id="fillTool" 
                        onClick={(e) => { e.preventDefault(); setTool('fill'); }}
                        style={{ background: tool === 'fill' ? '#00f3ff' : '#1e293b', border: tool === 'fill' ? 'none' : '1px solid #334155', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool === 'fill' ? '#0b0f19' : 'inherit' }} 
                        title="Boya Kovası"
                      >🪣</button>
                  </div>

                  {/* Yatay Kaydırmalı Neon Renk Paleti */}
                  <div style={{ flex: 1, display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin', scrollbarColor: '#00f3ff #1e293b' }}>
                      {['#00f3ff', '#b026ff', '#00ff66', '#ff007f', '#ffee00', '#ffffff'].map(c => (
                        <div 
                          key={c}
                          onClick={() => { setColor(c); setTool(tool === 'eraser' ? 'brush' : tool); }}
                          style={{ minWidth: '28px', height: '28px', background: c, borderRadius: '50%', cursor: 'pointer', border: color === c && tool !== 'eraser' ? '2px solid #fff' : 'none' }}
                        ></div>
                      ))}
                      <div 
                        onClick={() => { setColor('#050811'); setTool('brush'); }}
                        style={{ minWidth: '28px', height: '28px', background: '#050811', borderRadius: '50%', cursor: 'pointer', border: color === '#050811' ? '2px solid #fff' : '1px solid #475569' }} 
                        title="Silgi/Siyah"
                      ></div>
                  </div>

                  {/* Temizle Butonu */}
                  <button 
                    id="clearBtn" 
                    onClick={(e) => { e.preventDefault(); clearCanvas(); }}
                    style={{ background: 'rgba(255, 0, 127, 0.2)', border: '1px solid #ff007f', color: '#ff007f', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >Temizle</button>
              </div>
            )}
        </div>

        {/* SAĞ SÜTUN: Tahmin Sohbeti */}
        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ color: '#00f3ff', fontSize: '14px', marginBottom: '12px', letterSpacing: '1px' }}>CANLI TAHMİNLER</h3>
            <div id="chatMessages" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>Oyun başladı! Tahminini aşağıya yaz.</div>
                {room.chat?.map((msg, i) => {
                  const isSystem = msg.isSystem;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px', borderRadius: '4px', background: isSystem ? 'rgba(0, 243, 255, 0.1)' : 'transparent' }}>
                      {!isSystem && <span style={{ fontWeight: 'bold', color: '#94a3b8', flexShrink: 0 }}>{msg.senderName}:</span>}
                      <span style={{ color: isSystem ? '#00f3ff' : '#cbd5e1', fontWeight: isSystem ? 'bold' : 'normal', wordBreak: 'break-word' }}>{msg.text}</span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleGuessSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  id="guessInput" 
                  disabled={isDrawer || hasGuessed}
                  value={guess}
                  onChange={e => setGuess(e.target.value.toLocaleUpperCase('tr-TR'))}
                  placeholder={isDrawer ? "Çizen kişi tahmin edemez" : (hasGuessed ? "Doğru bildin!" : "Tahminini buraya yaz...")} 
                  style={{ flex: 1, background: '#050811', border: '1px solid rgba(0, 243, 255, 0.3)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} 
                />
                <button 
                  type="submit" 
                  disabled={isDrawer || hasGuessed || !guess.trim()}
                  id="sendGuessBtn" 
                  style={{ background: '#00f3ff', border: 'none', color: '#0b0f19', fontWeight: 'bold', padding: '0 12px', borderRadius: '6px', cursor: (isDrawer || hasGuessed || !guess.trim()) ? 'not-allowed' : 'pointer', opacity: (isDrawer || hasGuessed || !guess.trim()) ? 0.5 : 1 }}
                >Gönder</button>
            </form>
        </div>
    </div>
  );
}
`;

code = code.replace(returnRegex, newReturn);

// Ensure the clear function uses the new background color (#050811)
code = code.replace(/#0f172a/g, '#050811');

fs.writeFileSync('src/components/SketchGame.tsx', code);
console.log('Replaced JSX return');
