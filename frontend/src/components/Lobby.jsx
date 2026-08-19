import React, { useState } from 'react';

const Lobby = ({ roomState, playerId, onCreateRoom, onJoinRoom, onJoinTeam, onStartGame }) => {
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');

    if (roomState) {
        const teamA = roomState.players.filter(p => p.team === 'A');
        const teamB = roomState.players.filter(p => p.team === 'B');
        const unassigned = roomState.players.filter(p => p.team === null);
        const isHost = roomState.hostId === playerId;
        const canStart = teamA.length === roomState.maxPlayers / 2 && teamB.length === roomState.maxPlayers / 2;

        return (
            <div className="lobby-container">
                <div className="lobby-card glass" style={{maxWidth: '600px', width: '100%'}}>
                    <h1>Room: {roomState.id}</h1>
                    <p style={{color: 'var(--text-muted)'}}>{roomState.players.length} / {roomState.maxPlayers} Players Joined</p>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', margin: '2rem 0', gap: '1rem'}}>
                        <div style={{flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                            <h3>Team A ({teamA.length}/{roomState.maxPlayers/2})</h3>
                            <button className="btn-primary" style={{margin: '1rem 0', padding: '0.5rem'}} onClick={() => onJoinTeam('A')}>Join A</button>
                            {teamA.map(p => <div key={p.id}>{p.name} {p.id === playerId ? '(You)' : ''}</div>)}
                        </div>
                        <div style={{flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                            <h3>Team B ({teamB.length}/{roomState.maxPlayers/2})</h3>
                            <button className="btn-primary" style={{margin: '1rem 0', padding: '0.5rem'}} onClick={() => onJoinTeam('B')}>Join B</button>
                            {teamB.map(p => <div key={p.id}>{p.name} {p.id === playerId ? '(You)' : ''}</div>)}
                        </div>
                    </div>

                    {unassigned.length > 0 && (
                        <div style={{marginBottom: '2rem'}}>
                            <h4>Unassigned:</h4>
                            {unassigned.map(p => <span key={p.id} style={{marginRight: '1rem'}}>{p.name} {p.id === playerId ? '(You)' : ''}</span>)}
                        </div>
                    )}

                    {isHost ? (
                        <button className="btn-primary" disabled={!canStart} onClick={onStartGame} style={{opacity: canStart ? 1 : 0.5}}>
                            {canStart ? 'Start Game' : 'Waiting for balanced teams...'}
                        </button>
                    ) : (
                        <p style={{color: 'var(--accent)'}}>Waiting for host to start...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="lobby-container">
            <div className="lobby-card glass">
                <h1>Mendicoat</h1>
                <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>Create or join a game</p>
                
                <input 
                    type="text" 
                    placeholder="Your Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={{marginBottom: '1rem'}}
                />

                <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
                    <button className="btn-primary" onClick={() => name && onCreateRoom(name, 4)}>Create 4-Player</button>
                    <button className="btn-primary" onClick={() => name && onCreateRoom(name, 6)}>Create 6-Player</button>
                </div>

                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <input 
                        type="text" 
                        placeholder="Room Code" 
                        value={roomCode} 
                        onChange={(e) => setRoomCode(e.target.value)} 
                        style={{marginBottom: 0}}
                    />
                    <button className="btn-primary" onClick={() => name && roomCode && onJoinRoom(name, roomCode)}>Join Room</button>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
