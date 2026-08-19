import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameTable from './components/GameTable';

// Connect to backend server. In production (when served by Express), it connects to the same host.
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : undefined;

function App() {
  const [socket, setSocket] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setPlayerId(newSocket.id);
    });

    newSocket.on('room_created', ({ roomId, roomState }) => {
      console.log('Room created:', roomId);
      setRoomState(roomState);
    });

    newSocket.on('lobby_update', (updatedRoom) => {
      console.log('Lobby update:', updatedRoom);
      setRoomState(updatedRoom);
    });

    newSocket.on('game_start', (initialState) => {
      console.log('Game Started', initialState);
      setGameState(initialState);
    });

    newSocket.on('state_update', (newState) => {
      console.log('State updated', newState);
      setGameState(newState);
    });

    newSocket.on('hukum_established', (suit) => {
      console.log('Hukum established:', suit);
    });

    newSocket.on('error', (msg) => {
      console.error(msg);
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    });

    return () => newSocket.close();
  }, []);

  const handleCreateRoom = (name, maxPlayers) => {
    setPlayerName(name);
    socket.emit('create_room', { playerName: name, maxPlayers });
  };

  const handleJoinRoom = (name, roomId) => {
    setPlayerName(name);
    socket.emit('join_room', { roomId, playerName: name });
  };

  const handleJoinTeam = (teamId) => {
    if (roomState) {
      socket.emit('join_team', { roomId: roomState.id, teamId });
    }
  };

  const handleStartGame = () => {
    if (roomState) {
      socket.emit('start_game', { roomId: roomState.id });
    }
  };

  const handlePlayCard = (card) => {
    if (gameState && socket) {
      socket.emit('play_card', {
        roomId: gameState.roomId,
        playerId,
        card
      });
    }
  };

  return (
    <>
      {errorMsg && (
        <div style={{
          position: 'absolute', top: 20, right: 20, background: 'var(--card-red)', 
          color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 1000
        }}>
          {errorMsg}
        </div>
      )}

      {!gameState ? (
        <Lobby 
          roomState={roomState}
          playerId={playerId}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onJoinTeam={handleJoinTeam}
          onStartGame={handleStartGame}
        />
      ) : (
        <GameTable 
          gameState={gameState} 
          playerId={playerId} 
          onPlayCard={handlePlayCard} 
        />
      )}
    </>
  );
}

export default App;
