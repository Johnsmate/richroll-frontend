const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const rooms = {};

console.log("--- เซิร์ฟเวอร์ Bankroll กำลังทำงาน ---");

io.on('connection', (socket) => {
    console.log(`มีผู้เล่นเชื่อมต่อเข้ามา: ${socket.id}`);

    // ================= 1. ระบบสร้างห้องใหม่ =================
    socket.on('create_room', () => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase(); 
        rooms[roomId] = {
            status: 'waiting', 
            turnIndex: 0,      
            players: [],        
            board: [
                { id: 0, name: "START", type: "special" },
                { id: 1, name: "กรุงเทพ", color: "#38bdf8", type: "city", price: 200, rent: [20, 60, 180, 450], owner: null, buildings: 0 },
                { id: 2, name: "เชียงใหม่", color: "#38bdf8", type: "city", price: 180, rent: [15, 45, 130, 380], owner: null, buildings: 0 },
                { id: 3, name: "โชคดี", type: "chance" },
                { id: 4, name: "ภูเก็ต", color: "#38bdf8", type: "city", price: 150, rent: [12, 35, 100, 300], owner: null, buildings: 0 },
                { id: 5, name: "รถไฟ 1", type: "public", price: 300, baseRent: 50, owner: null },
                { id: 6, name: "คุก", type: "special" },
                { id: 7, name: "โตเกียว", color: "#a855f7", type: "city", price: 250, rent: [25, 75, 220, 550], owner: null, buildings: 0 },
                { id: 8, name: "โอซาก้า", color: "#a855f7", type: "city", price: 220, rent: [22, 65, 200, 500], owner: null, buildings: 0 },
                { id: 9, name: "กองทุน", type: "chest" },
                { id: 10, name: "โซล", color: "#a855f7", type: "city", price: 240, rent: [24, 70, 210, 520], owner: null, buildings: 0 },
                { id: 11, name: "รถไฟ 2", type: "public", price: 300, baseRent: 50, owner: null },
                { id: 12, name: "ที่จอดรถ", type: "special" },
                { id: 13, name: "ลอนดอน", color: "#f97316", type: "city", price: 320, rent: [32, 90, 270, 700], owner: null, buildings: 0 },
                { id: 14, name: "ปารีส", color: "#f97316", type: "city", price: 300, rent: [30, 85, 250, 650], owner: null, buildings: 0 },
                { id: 15, name: "โชคดี", type: "chance" },
                { id: 16, name: "โรม", color: "#f97316", type: "city", price: 280, rent: [28, 80, 240, 600], owner: null, buildings: 0 },
                { id: 17, name: "ประปา", type: "public", price: 150, baseRent: 30, owner: null },
                { id: 18, name: "ไปคุก", type: "special" },
                { id: 19, name: "นิวยอร์ก", color: "#10b981", type: "city", price: 400, rent: [50, 150, 450, 1000], owner: null, buildings: 0 },
                { id: 20, name: "ลอสแอนเจลิส", color: "#10b981", type: "city", price: 350, rent: [35, 100, 300, 800], owner: null, buildings: 0 },
                { id: 21, name: "กองทุน", type: "chest" },
                { id: 22, name: "ชิคาโก", color: "#10b981", type: "city", price: 320, rent: [32, 90, 270, 700], owner: null, buildings: 0 },
                { id: 23, name: "ไฟฟ้า", type: "public", price: 150, baseRent: 30, owner: null }
            ]
        };
        socket.emit('room_created', roomId);
        console.log(`สร้างห้องใหม่สำเร็จ รหัสห้อง: ${roomId}`);
    });

    // ================= 2. ระบบเข้าร่วมห้อง (Join Room) =================
    socket.on('join_room', ({ roomId, playerName }) => {
        const room = rooms[roomId];

        if (!room) {
            return socket.emit('error_message', 'ไม่พบรหัสห้องนี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
        }
        if (room.status === 'playing') {
            return socket.emit('error_message', 'เกมในห้องนี้เริ่มไปแล้วครับ เข้ากลุ่มไม่ได้แล้ว');
        }
        if (room.players.length >= 4) {
            return socket.emit('error_message', 'ห้องนี้เต็มแล้วครับ (สูงสุด 4 คน)');
        }

        const newPlayer = {
            id: socket.id,
            name: playerName || `ผู้เล่น ${room.players.length + 1}`,
            cash: 1500,       
            netWorth: 1500,   
            position: 0,      
            inJail: false,
            jailTurns: 0
        };

        room.players.push(newPlayer);
        socket.join(roomId);

        io.to(roomId).emit('room_updated', room);
        console.log(`คุณ ${playerName} เข้าห้อง [${roomId}] เรียบร้อย`);
    });

    // ================= 3. ระบบเริ่มเกม (Start Game) =================
    socket.on('start_game', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.players[0].id !== socket.id) {
            return socket.emit('error_message', 'คุณไม่ใช่เจ้าของห้อง ไม่มีสิทธิ์กดเริ่มเกมครับ');
        }

        if (room.players.length < 2) {
            return socket.emit('error_message', 'ต้องมีผู้เล่นอย่างน้อย 2 คนขึ้นไปจึงจะเริ่มเกมได้ครับ');
        }

        room.status = 'playing';

        room.players.forEach((player, index) => {
            if (index > 0) {
                const compensation = index * 50; 
                player.cash += compensation;
                player.netWorth += compensation;
            }
        });

        io.to(roomId).emit('room_updated', room);
        console.log(`ห้อง [${roomId}] ได้เริ่มเกมการแข่งขันแล้ว!`);
    });

    // ================= 4. ระบบทอยลูกเต๋า (Roll Dice) =================
    socket.on('roll_dice', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;

        const currentPlayer = room.players[room.turnIndex];
        if (currentPlayer.id !== socket.id) {
            return socket.emit('error_message', 'ยังไม่ถึงตาของคุณครับ ใจเย็น ๆ ก่อนนะ');
        }

        const dice = Math.floor(Math.random() * 6) + 1;
        const oldPosition = currentPlayer.position;
        currentPlayer.position = (oldPosition + dice) % 24;

        let logMessage = `${currentPlayer.name} ทอยได้เลข ${dice} เดินไปช่องที่ ${currentPlayer.position}`;

        if (currentPlayer.position < oldPosition) {
            currentPlayer.cash += 200;
            currentPlayer.netWorth += 200;
            logMessage += ` 💸 และได้รับเงินผ่านช่อง START อีก $200!`;
        }

        io.to(roomId).emit('dice_rolled', { dice: dice, message: logMessage });

        if (dice !== 6) {
            room.turnIndex = (room.turnIndex + 1) % room.players.length;
        }

        io.to(roomId).emit('room_updated', room);
    });

    // ================= 5. ระบบซื้อที่ดิน (Buy Property) =================
    socket.on('buy_property', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room || room.status !== 'playing') return;

        const player = room.players[room.turnIndex];
        if (player.id !== socket.id) return; 

        const tile = room.board[player.position];

        if ((tile.type === 'city' || tile.type === 'public') && !tile.owner) {
            if (player.cash >= tile.price) {
                player.cash -= tile.price;
                tile.owner = player.id; 

                player.netWorth = player.cash; 
                room.board.forEach(t => {
                    if (t.owner === player.id) player.netWorth += t.price;
                });

                console.log(`${player.name} ซื้อที่ดิน ${tile.name} สำเร็จ!`);
                io.to(roomId).emit('room_updated', room);
            } else {
                socket.emit('error_message', 'เงินสดของคุณมีไม่เพียงพอสำหรับซื้อที่ดินแปลงนี้ครับ');
            }
        }
    });

    // ================= 6. ระบบเมื่อผู้เล่นปิดเว็บออกไป =================
    socket.on('disconnect', () => {
        console.log(`ผู้เล่นหลุดออกไป: ${socket.id}`);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                const removedPlayer = room.players[playerIndex];
                room.players.splice(playerIndex, 1);
                
                // คืนความเป็นเจ้าของที่ดินทั้งหมดให้ว่างเปล่า
                room.board.forEach(tile => {
                    if(tile.owner === socket.id) tile.owner = null;
                });

                if (room.players.length === 0) {
                    delete rooms[roomId];
                } else {
                    if (room.turnIndex >= room.players.length) {
                        room.turnIndex = 0;
                    }
                    io.to(roomId).emit('room_updated', room);
                }
                break;
            }
        }
    });
});

// เปลี่ยนจากเดิม: server.listen(3001, ...
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์รันที่พอร์ต ${PORT} สำเร็จแล้ว`);
});