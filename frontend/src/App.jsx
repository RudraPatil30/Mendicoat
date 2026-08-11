import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameTable from './components/GameTable';

// Connect to backend server. In production (when served by Express), it connects to the same host.
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : undefined;

function App() {
  const [socket, setSocket] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('match_found', (data) => {
      console.log('Match found!', data);
      setInQueue(false);
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

  const handleJoin = (name) => {
    const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
    setPlayerId(newId);
    
    socket.emit('join_queue', { id: newId, name });
    setInQueue(true);
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
        inQueue ? (
          <div className="lobby-container">
            <div className="lobby-card glass">
              <h2>Waiting for other players...</h2>
              <div style={{marginTop: '2rem'}}>
                <div style={{width: 40, height: 40, border: '4px solid var(--glass-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
              </div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          <Lobby onJoin={handleJoin} />
        )
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
