import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// เชื่อมต่อไปยังเซิร์ฟเวอร์หลังบ้านพอร์ต 3001
const socket = io('https://richroll-backend-production.up.railway.app');

const BOARD_LAYOUT = [
  { id: 0, name: "START", color: "#ef4444", type: "special" },
  { id: 1, name: "กรุงเทพ", color: "#38bdf8", type: "city", price: 200 },
  { id: 2, name: "เชียงใหม่", color: "#38bdf8", type: "city", price: 180 },
  { id: 3, name: "โชคดี", color: "#eab308", type: "chance" },
  { id: 4, name: "ภูเก็ต", color: "#38bdf8", type: "city", price: 150 },
  { id: 5, name: "รถไฟ 1", color: "#64748b", type: "public", price: 300 },
  { id: 6, name: "คุก", color: "#475569", type: "special" },
  { id: 7, name: "โตเกียว", color: "#a855f7", type: "city", price: 250 },
  { id: 8, name: "โอซาก้า", color: "#a855f7", type: "city", price: 220 },
  { id: 9, name: "กองทุน", color: "#ec4899", type: "chest" },
  { id: 10, name: "โซล", color: "#a855f7", type: "city", price: 240 },
  { id: 11, name: "รถไฟ 2", color: "#64748b", type: "public", price: 300 },
  { id: 12, name: "ที่จอดรถ", color: "#22c55e", type: "special" },
  { id: 13, name: "ลอนดอน", color: "#f97316", type: "city", price: 320 },
  { id: 14, name: "ปารีส", color: "#f97316", type: "city", price: 300 },
  { id: 15, name: "โชคดี", color: "#eab308", type: "chance" },
  { id: 16, name: "โรม", color: "#f97316", type: "city", price: 280 },
  { id: 17, name: "ประปา", color: "#06b6d4", type: "public", price: 150 },
  { id: 18, name: "ไปคุก", color: "#dc2626", type: "special" },
  { id: 19, name: "นิวยอร์ก", color: "#10b981", type: "city", price: 400 },
  { id: 20, name: "ลอสแอนเจลิส", color: "#10b981", type: "city", price: 350 },
  { id: 21, name: "กองทุน", color: "#ec4899", type: "chest" },
  { id: 22, name: "ชิคาโก", color: "#10b981", type: "city", price: 320 },
  { id: 23, name: "ไฟฟ้า", color: "#06b6d4", type: "public", price: 150 },
];

const getGridCoords = (index) => {
  if (index >= 0 && index <= 6) return { row: 1, col: index + 1 }; 
  if (index >= 7 && index <= 11) return { row: index - 5, col: 7 }; 
  if (index >= 12 && index <= 18) return { row: 7, col: 7 - (index - 12) }; 
  if (index >= 19 && index <= 23) return { row: 7 - (index - 18), col: 1 }; 
  return { row: 1, col: 1 };
};

function App() {
  const [playerName, setPlayerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [diceResult, setDiceResult] = useState(null);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));

    socket.on('room_created', (id) => {
      setCurrentRoomId(id);
      socket.emit('join_room', { roomId: id, playerName: playerName || 'Host' });
    });

    socket.on('room_updated', (data) => {
      setRoomData(data);
    });

    socket.on('dice_rolled', ({ dice, message }) => {
      setDiceResult(dice);
      if(message) console.log(message);
    });

    socket.on('error_message', (msg) => alert(msg));

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_updated');
      socket.off('dice_rolled');
      socket.off('error_message');
    };
  }, [playerName]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return alert('กรุณากรอกชื่อของคุณก่อนสร้างห้องครับ');
    socket.emit('create_room');
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) return alert('กรุณากรอกชื่อของคุณก่อนครับ');
    if (!inputRoomId.trim()) return alert('กรุณากรอกรหัสห้องก่อนครับ');
    
    const targetId = inputRoomId.trim().toUpperCase();
    setCurrentRoomId(targetId);
    socket.emit('join_room', { roomId: targetId, playerName });
  };

  const handleStartGame = () => {
    socket.emit('start_game', { roomId: currentRoomId });
  };

  const handleRollDice = () => {
    socket.emit('roll_dice', { roomId: currentRoomId });
  };

  const handleBuyProperty = () => {
    socket.emit('buy_property', { roomId: currentRoomId });
  };

  const getOwnerName = (ownerId) => {
    const owner = roomData?.players.find(p => p.id === ownerId);
    return owner ? owner.name : '';
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {!roomData ? (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#34d399', fontSize: '3rem', marginBottom: '5px', fontWeight: 'bold' }}>BANKROLL ONLINE</h1>
          <p style={{ margin: '0 0 30px 0', color: '#64748b' }}>สถานะเซิร์ฟเวอร์: {isConnected ? <span style={{color: '#4ade80'}}>● ออนไลน์</span> : <span style={{color: '#f87171'}}>● เชื่อมต่อขัดข้อง</span>}</p>
          
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '10px', width: '350px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', margin: '0 auto' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'left' }}>ชื่อผู้เล่นของคุณ:</label>
            <input type="text" placeholder="เช่น โทนี่, สมชาย" value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', marginBottom: '20px', boxSizing: 'border-box' }} />
            <button onClick={handleCreateRoom} style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' }}>สร้างห้องเกมใหม่ 🎲</button>
            <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginBottom: '15px' }}>— หรือ —</div>
            <input type="text" placeholder="ใส่รหัสห้อง 5 หลักเพื่อจอย" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#facc15', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <button onClick={handleJoinRoom} style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>เข้าร่วมห้องเพื่อน 👥</button>
          </div>
        </div>
      ) : roomData.status === 'waiting' ? (
        <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>รหัสห้องสำหรับชวนเพื่อน</p>
          <h2 style={{ margin: '5px 0 20px 0', color: '#facc15', fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '4px' }}>{currentRoomId}</h2>
          <h3 style={{ textAlign: 'left', color: '#94a3b8', fontSize: '1rem', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '10px' }}>รายชื่อผู้เล่นในห้องตอนนี้ ({roomData.players.length}/4 คน):</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
            {roomData.players.map((player, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#334155', padding: '12px', borderRadius: '5px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>👤 {player.name} {player.id === socket.id && <span style={{color: '#38bdf8', fontSize: '0.8rem'}}>(คุณ)</span>}</span>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>${player.cash}</span>
              </div>
            ))}
          </div>
          {roomData.players[0]?.id === socket.id ? (
            <button onClick={handleStartGame} style={{ width: '100%', backgroundColor: '#facc15', color: '#0f172a', border: 'none', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>เริ่มเกมเลย! 🚀</button>
          ) : (
            <button style={{ width: '100%', backgroundColor: '#475569', color: '#94a3b8', border: 'none', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '5px', cursor: 'not-allowed' }}>รอหัวหน้าห้องกดเริ่มเกม... ⏳</button>
          )}
        </div>
      ) : (
        /* หน้าจอเกมหลักบอร์ด 24 ช่อง */
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 90px)', gridTemplateRows: 'repeat(7, 90px)', gap: '4px', backgroundColor: '#334155', padding: '10px', borderRadius: '10px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            {BOARD_LAYOUT.map((tile) => {
              const coords = getGridCoords(tile.id);
              const serverTile = roomData?.board?.[tile.id];
              return (
                <div key={tile.id} style={{ gridRow: coords.row, gridColumn: coords.col, backgroundColor: '#1e293b', border: '2px solid #475569', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '6px', position: 'relative', boxSizing: 'border-box' }}>
                  <div style={{ height: '12px', backgroundColor: tile.color, borderRadius: '3px 3px 0 0', margin: '-6px -6px 4px -6px' }}></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-word' }}>{tile.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#facc15', textAlign: 'center' }}>{tile.price ? `$${tile.price}` : ''}</div>
                  
                  {serverTile?.owner && (
                    <div style={{ fontSize: '0.65rem', color: '#4ade80', textAlign: 'center', fontWeight: 'bold' }}>
                      🏠 {getOwnerName(serverTile.owner)}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', position: 'absolute', bottom: '4px', left: 0, right: 0 }}>
                    {roomData.players.filter(p => p.position === tile.id).map((p, pIdx) => (
                      <span key={pIdx} style={{ width: '12px', height: '12px', borderRadius: '5px', backgroundColor: roomData.players.findIndex(pl => pl.id === p.id) === 0 ? '#ef4444' : roomData.players.findIndex(pl => pl.id === p.id) === 1 ? '#3b82f6' : roomData.players.findIndex(pl => pl.id === p.id) === 2 ? '#10b981' : '#eab308', display: 'inline-block', border: '1px solid white' }}></span>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ gridRow: '2 / 7', gridColumn: '2 / 7', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#94a3b8', margin: '0 0 5px 0' }}>ห้อง: {currentRoomId}</h2>
              {diceResult && <div style={{ fontSize: '2rem', margin: '5px 0' }}>🎲 <span style={{ color: '#facc15', fontWeight: 'bold' }}>{diceResult}</span></div>}

              {(() => {
                const currentPlayer = roomData.players[roomData.turnIndex];
                const currentTile = roomData.board[currentPlayer.position];
                const isMyTurn = currentPlayer.id === socket.id;

                return (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <p style={{ color: '#a855f7', fontWeight: 'bold', margin: '5px 0' }}>ตาของ: {currentPlayer.name} {isMyTurn && "(คุณ)"}</p>
                    {isMyTurn ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                        <button onClick={handleRollDice} style={{ backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '10px 25px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>ทอยลูกเต๋า 🎲</button>
                        {(currentTile.type === 'city' || currentTile.type === 'public') && !currentTile.owner && (
                          <button onClick={handleBuyProperty} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer', width: '80%' }}>ซื้อ {currentTile.name} (${currentTile.price}) 💰</button>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '10px' }}>รอผู้เล่นคนอื่นดำเนินเทิร์น...</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ตารางแสดงเงินผู้เล่น */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', width: '280px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #334155', paddingBottom: '8px', color: '#34d399' }}>💰 สถานะผู้เล่น</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomData.players.map((player, idx) => (
                <div key={idx} style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px', borderLeft: `5px solid ${idx === 0 ? '#ef4444' : idx === 1 ? '#3b82f6' : idx === 2 ? '#10b981' : '#eab308'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.95rem' }}>
                    <span>{player.name}</span>
                    <span style={{ color: '#4ade80' }}>${player.cash}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>มูลค่าสุทธิ: ${player.netWorth}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;