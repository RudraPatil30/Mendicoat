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

const rooms = new Map();
const activeGames = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new room (Host)
    socket.on('create_room', ({ playerName, maxPlayers }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const player = { socketId: socket.id, id: socket.id, name: playerName, team: null, isHost: true };
        
        rooms.set(roomId, {
            id: roomId,
            maxPlayers: maxPlayers,
            hostId: socket.id,
            players: [player],
            status: 'LOBBY'
        });
        
        socket.join(roomId);
        socket.emit('room_created', { roomId, roomState: rooms.get(roomId) });
    });

    // Join an existing room
    socket.on('join_room', ({ roomId, playerName }) => {
        const upperRoomId = roomId.toUpperCase();
        const room = rooms.get(upperRoomId);
        if (!room) return socket.emit('error', 'Room not found');
        if (room.status !== 'LOBBY') return socket.emit('error', 'Game already started');
        if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Room is full');
        
        const player = { socketId: socket.id, id: socket.id, name: playerName, team: null, isHost: false };
        room.players.push(player);
        
        socket.join(upperRoomId);
        io.to(upperRoomId).emit('lobby_update', room);
    });

    // Join a specific team
    socket.on('join_team', ({ roomId, teamId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            // Validate team size
            const teamCount = room.players.filter(p => p.team === teamId).length;
            if (teamCount >= room.maxPlayers / 2) {
                return socket.emit('error', 'Team is full');
            }
            player.team = teamId;
            io.to(roomId).emit('lobby_update', room);
        }
    });

    // Start game (Host only)
    socket.on('start_game', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        if (room.hostId !== socket.id) return socket.emit('error', 'Only host can start');
        
        const teamA = room.players.filter(p => p.team === 'A');
        const teamB = room.players.filter(p => p.team === 'B');
        
        if (teamA.length !== room.maxPlayers / 2 || teamB.length !== room.maxPlayers / 2) {
            return socket.emit('error', 'Teams must be fully balanced to start');
        }

        room.status = 'PLAYING';
        io.to(roomId).emit('lobby_update', room);

        const GameEngine = require('./src/game/GameEngine');
        const Team = require('./src/game/Team');
        const Player = require('./src/game/Player');

        const engine = new GameEngine(roomId);
        const t1 = new Team('A', 'Team A');
        const t2 = new Team('B', 'Team B');

        teamA.forEach(p => t1.addPlayer(new Player(p.id, p.name, t1.id)));
        teamB.forEach(p => t2.addPlayer(new Player(p.id, p.name, t2.id)));

        engine.initializeGame(t1, t2);
        activeGames.set(roomId, engine);

        io.to(roomId).emit('game_start', engine.gameState);
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
        // Remove from rooms if in lobby
        for (const [roomId, room] of rooms.entries()) {
            if (room.status === 'LOBBY') {
                const idx = room.players.findIndex(p => p.socketId === socket.id);
                if (idx !== -1) {
                    room.players.splice(idx, 1);
                    io.to(roomId).emit('lobby_update', room);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
