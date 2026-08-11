const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Serve the compiled React frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const matchmakingQueue = [];
const activeGames = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_queue', (userData) => {
        const player = { socketId: socket.id, ...userData };
        matchmakingQueue.push(player);
        
        console.log(`Player ${player.name} joined queue. Queue size: ${matchmakingQueue.length}`);

        if (matchmakingQueue.length >= 4) {
            const players = matchmakingQueue.splice(0, 4);
            const roomId = `room_${Date.now()}`;
            
            players.forEach(p => {
                const s = io.sockets.sockets.get(p.socketId);
                if (s) s.join(roomId);
            });

            const GameEngine = require('./src/game/GameEngine');
            const Team = require('./src/game/Team');
            const Player = require('./src/game/Player');

            const engine = new GameEngine(roomId);
            
            const team1 = new Team('t1', 'Team A');
            const team2 = new Team('t2', 'Team B');
            
            const p1 = new Player(players[0].id, players[0].name, team1.id);
            const p2 = new Player(players[1].id, players[1].name, team2.id);
            const p3 = new Player(players[2].id, players[2].name, team1.id);
            const p4 = new Player(players[3].id, players[3].name, team2.id);

            team1.addPlayer(p1);
            team1.addPlayer(p3);
            team2.addPlayer(p2);
            team2.addPlayer(p4);

            engine.initializeGame([p1, p2, p3, p4], team1, team2);
            activeGames.set(roomId, engine);

            io.to(roomId).emit('match_found', { roomId, players });
            io.to(roomId).emit('game_start', engine.gameState);
        }
    });

    socket.on('play_card', ({ roomId, playerId, card }) => {
        const engine = activeGames.get(roomId);
        if (!engine) return socket.emit('error', 'Game not found');

        try {
            engine.playCard(playerId, card);
            if (engine.gameState.hukumSuit !== null) {
                io.to(roomId).emit('hukum_established', engine.gameState.hukumSuit);
            }
            io.to(roomId).emit('state_update', engine.gameState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const idx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
        if (idx !== -1) matchmakingQueue.splice(idx, 1);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
