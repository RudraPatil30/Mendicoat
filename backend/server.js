require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/auth');

const jwt = require('jsonwebtoken');
// Prisma initialization moved to db.js

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { 
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true
    }
});

const prisma = require('./src/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Manual cookie parser
const parseCookies = (cookieString) => {
    if (!cookieString) return {};
    return cookieString.split(';').reduce((res, item) => {
        const parts = item.split('=');
        res[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
        return res;
    }, {});
};

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

// Serve the compiled React frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback route for React Router (using regex to avoid Express 5 path-to-regexp errors)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

const rooms = new Map();
const activeGames = new Map();

// Socket Authentication Middleware
io.use(async (socket, next) => {
    try {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        const token = cookies.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        
        if (!user) {
            return next(new Error('User not found'));
        }
        
        socket.userId = user.id;
        socket.username = user.username;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} (User: ${socket.username}, ID: ${socket.userId})`);

    // Handle reconnection to active rooms
    for (const [roomId, room] of rooms.entries()) {
        const player = room.players.find(p => p.id === socket.userId);
        if (player) {
            console.log(`Reconnecting user ${socket.username} to room ${roomId}`);
            player.socketId = socket.id;
            
            socket.join(roomId);
            if (room.status === 'LOBBY') {
                socket.emit('room_created', { roomId, roomState: room });
                io.to(roomId).emit('lobby_update', room);
            } else if (room.status === 'PLAYING') {
                const engine = activeGames.get(roomId);
                if (engine) {
                    socket.emit('room_created', { roomId, roomState: room });
                    socket.emit('lobby_update', room); 
                    socket.emit('game_start', engine.gameState); 
                }
            }
        }
    }

    // Create a new room (Host)
    socket.on('create_room', ({ maxPlayers }) => {
        const numMaxPlayers = parseInt(maxPlayers, 10);
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const player = { socketId: socket.id, id: socket.userId, name: socket.username, team: null, isHost: true };
        
        rooms.set(roomId, {
            id: roomId,
            maxPlayers: numMaxPlayers,
            hostId: socket.userId,
            players: [player],
            status: 'LOBBY'
        });
        
        socket.join(roomId);
        socket.emit('room_created', { roomId, roomState: rooms.get(roomId) });
    });

    // Join an existing room
    socket.on('join_room', ({ roomId }) => {
        const upperRoomId = roomId.toUpperCase();
        const room = rooms.get(upperRoomId);
        if (!room) return socket.emit('error', 'Room not found');
        if (room.status !== 'LOBBY') return socket.emit('error', 'Game already started');
        
        // Prevent duplicate joining
        if (room.players.some(p => p.id === socket.userId)) return;

        if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Room is full');
        
        const player = { socketId: socket.id, id: socket.userId, name: socket.username, team: null, isHost: false };
        room.players.push(player);
        
        socket.join(upperRoomId);
        io.to(upperRoomId).emit('lobby_update', room);
    });

    // Join a specific team
    socket.on('join_team', ({ roomId, teamId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.userId);
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
        try {
            const room = rooms.get(roomId);
            if (!room) return;
            if (room.hostId !== socket.userId) return socket.emit('error', 'Only host can start');
            
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
            const maxPerTeam = room.maxPlayers / 2;
            const t1 = new Team('A', 'Team A', maxPerTeam);
            const t2 = new Team('B', 'Team B', maxPerTeam);

            teamA.forEach(p => t1.addPlayer(new Player(p.id, p.name, t1.id)));
            teamB.forEach(p => t2.addPlayer(new Player(p.id, p.name, t2.id)));

            engine.initializeGame(t1, t2);
            activeGames.set(roomId, engine);

            io.to(roomId).emit('game_start', engine.gameState);
        } catch (err) {
            console.error("Error starting game:", err);
            socket.emit('error', 'Failed to start game: ' + err.message);
        }
    });

    socket.on('play_card', ({ roomId, card }) => {
        const engine = activeGames.get(roomId);
        if (!engine) return socket.emit('error', 'Game not found');

        try {
            const result = engine.playCard(socket.userId, card);
            if (engine.gameState.hukumSuit !== null) {
                io.to(roomId).emit('hukum_established', engine.gameState.hukumSuit);
            }
            io.to(roomId).emit('state_update', engine.gameState);

            if (result && result.trickComplete) {
                setTimeout(async () => {
                    engine.handleTrickCompletion();
                    
                    if (engine.gameState.status === 'ENDED' && !engine.gameState.savedToDb) {
                        engine.gameState.savedToDb = true;
                        try {
                            const teamATens = engine.gameState.teams[0].getCapturedTensCount();
                            const teamBTens = engine.gameState.teams[1].getCapturedTensCount();
                            
                            let winningTeam = null;
                            if (teamATens > teamBTens) winningTeam = engine.gameState.teams[0].id;
                            else if (teamBTens > teamATens) winningTeam = engine.gameState.teams[1].id;

                            await prisma.game.create({
                                data: {
                                    roomId: roomId,
                                    winningTeam: winningTeam,
                                    participants: {
                                        create: engine.gameState.players.map(p => {
                                            const t = engine.gameState.teams.find(team => team.players.some(tp => tp.id === p.id));
                                            return {
                                                userId: p.id,
                                                team: t.id,
                                                score: t.getCapturedTensCount()
                                            };
                                        })
                                    }
                                }
                            });
                            console.log(`Game in room ${roomId} saved to database.`);
                        } catch (err) {
                            console.error("Failed to save game to database:", err);
                        }
                    }

                    io.to(roomId).emit('state_update', engine.gameState);
                }, 5000);
            }
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('leave_room', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const idx = room.players.findIndex(p => p.socketId === socket.id);
        if (idx !== -1) {
            room.players.splice(idx, 1);
            if (room.players.length === 0) {
                rooms.delete(roomId);
                activeGames.delete(roomId);
            } else {
                if (room.hostId === socket.userId) {
                    room.hostId = room.players[0].id;
                    room.players[0].isHost = true;
                }
                io.to(roomId).emit('lobby_update', room);
            }
            socket.leave(roomId);
        }
    });

    socket.on('return_to_lobby', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        if (room.hostId !== socket.userId) return socket.emit('error', 'Only host can restart');
        
        room.status = 'LOBBY';
        activeGames.delete(roomId);
        io.to(roomId).emit('returned_to_lobby', room);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id} (User: ${socket.username})`);
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
