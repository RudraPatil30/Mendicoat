import React, { useState } from 'react';

const Lobby = ({ onJoin }) => {
    const [name, setName] = useState('');

    const handleJoin = () => {
        if (name.trim()) {
            onJoin(name);
        }
    }

    return (
        <div className="lobby-container">
            <div className="lobby-card glass">
                <h1>Mendicoat</h1>
                <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>Enter your name to join the matchmaking queue</p>
                <input 
                    type="text" 
                    placeholder="Your Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button className="btn-primary" onClick={handleJoin}>
                    Find Match
                </button>
            </div>
        </div>
    );
};

export default Lobby;
