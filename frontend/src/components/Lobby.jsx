import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Lobby = ({ roomState, playerId, onCreateRoom, onJoinRoom, onJoinTeam, onStartGame }) => {
    const [roomCode, setRoomCode] = useState('');
    const { user, logout } = useAuth();

    if (roomState) {
        const teamA = roomState.players.filter(p => p.team === 'A');
        const teamB = roomState.players.filter(p => p.team === 'B');
        const unassigned = roomState.players.filter(p => p.team === null);
        const isHost = roomState.hostId === playerId;
        const canStart = teamA.length === roomState.maxPlayers / 2 && teamB.length === roomState.maxPlayers / 2;

        return (
            <div className="lobby-container">
                <div className="lobby-card glass" style={{maxWidth: '700px', width: '95%', position: 'relative'}}>
                    <button className="btn-secondary" onClick={logout} style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', padding: '0.4rem 1rem' }}>
                        <span style={{ fontSize: '1.2rem', paddingBottom: '2px' }}>&#9824;</span> Logout
                    </button>
                    
                    <h1 className="title-ornate">Room {roomState.id}</h1>
                    <p className="subtitle-ornate">&#9829; {roomState.players.length} / {roomState.maxPlayers} PLAYERS JOINED &#9827;</p>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', margin: '2.5rem 0', gap: '1.5rem', flexWrap: 'wrap'}}>
                        <div style={{flex: '1 1 250px', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px'}}>
                            <h3 style={{color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '2px'}}>TEAM A ({teamA.length}/{roomState.maxPlayers/2})</h3>
                            <button className="btn-primary" style={{marginBottom: '1.5rem', fontSize: '1rem', padding: '0.8rem'}} onClick={() => onJoinTeam('A')}>Join Team A</button>
                            {teamA.map(p => <div key={p.id} style={{padding: '0.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)'}}>{p.name} {p.id === playerId ? <span style={{color: 'var(--accent)'}}>(You)</span> : ''}</div>)}
                        </div>
                        <div style={{flex: '1 1 250px', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px'}}>
                            <h3 style={{color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '2px'}}>TEAM B ({teamB.length}/{roomState.maxPlayers/2})</h3>
                            <button className="btn-primary" style={{marginBottom: '1.5rem', fontSize: '1rem', padding: '0.8rem'}} onClick={() => onJoinTeam('B')}>Join Team B</button>
                            {teamB.map(p => <div key={p.id} style={{padding: '0.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)'}}>{p.name} {p.id === playerId ? <span style={{color: 'var(--accent)'}}>(You)</span> : ''}</div>)}
                        </div>
                    </div>

                    {unassigned.length > 0 && (
                        <div style={{marginBottom: '2.5rem', padding: '1rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px'}}>
                            <h4 style={{color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '1px'}}>UNASSIGNED</h4>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center'}}>
                                {unassigned.map(p => <span key={p.id} style={{padding: '0.4rem 1rem', background: 'rgba(212,175,55,0.1)', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.3)'}}>{p.name} {p.id === playerId ? '(You)' : ''}</span>)}
                            </div>
                        </div>
                    )}

                    {isHost ? (
                        <button className="btn-primary" disabled={!canStart} onClick={onStartGame} style={{opacity: canStart ? 1 : 0.5, marginTop: '1rem'}}>
                            {canStart ? 'START GAME' : 'WAITING FOR BALANCED TEAMS...'}
                        </button>
                    ) : (
                        <p style={{color: 'var(--accent)', letterSpacing: '1px', marginTop: '1rem'}}>Waiting for host to start...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="lobby-container">
            <div className="lobby-card glass" style={{ position: 'relative' }}>
                <button className="btn-secondary" onClick={logout} style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', padding: '0.4rem 1rem' }}>
                    <span style={{ fontSize: '1.2rem', paddingBottom: '2px' }}>&#9824;</span> Logout
                </button>
                
                <h1 className="title-ornate">MENDICOAT</h1>
                <p className="subtitle-ornate">&#9829; THE CLASSIC CARD GAME &#9827;</p>
                
                <p style={{marginBottom: '2.5rem', color: 'var(--accent)', fontSize: '1.1rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                    <span>&#9830;</span> Welcome, {user?.username} <span>&#9830;</span>
                </p>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem'}}>
                    <button className="btn-primary" onClick={() => onCreateRoom(user?.username, 4)}>
                        Create 4-Player
                    </button>
                    <button className="btn-primary" onClick={() => onCreateRoom(user?.username, 6)} style={{ background: 'linear-gradient(to bottom, #b45309, #78350f)' }}>
                        Create 6-Player
                    </button>
                </div>

                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '2rem 0', color: 'var(--accent)'}}>
                    <div style={{flex: 1, height: '1px', background: 'var(--glass-border)'}}></div>
                    <span style={{letterSpacing: '2px', fontSize: '0.9rem'}}>OR JOIN A ROOM</span>
                    <div style={{flex: 1, height: '1px', background: 'var(--glass-border)'}}></div>
                </div>

                <div style={{display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
                    <input 
                        type="text" 
                        placeholder="&#9824; Enter Room Code" 
                        value={roomCode} 
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
                        style={{marginBottom: 0, flex: '1 1 200px'}}
                    />
                    <button className="btn-primary" disabled={!roomCode.trim()} style={{opacity: roomCode.trim() ? 1 : 0.5, flex: '1 1 150px'}} onClick={() => roomCode && onJoinRoom(user?.username, roomCode)}>
                        Join Room &#10095;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
