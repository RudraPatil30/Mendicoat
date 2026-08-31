import React from 'react';
import Card from './Card';

const getFanStyle = (idx, total, position) => {
    if (total <= 1) return { zIndex: 1 };
    const centerIdx = (total - 1) / 2;
    const offset = idx - centerIdx;

    if (position === 'bottom') {
        // Local player: flat overlapping row, no rotation or lift
        return { zIndex: idx + 1 };
    }

    // Opponent hands — directional rotation pointing tips toward center
    const maxRot = Math.min(20, total * 3);
    const angle = (offset / centerIdx) * maxRot;
    const arc = Math.abs(offset) * 2;

    let transform = '';
    switch (position) {
        case 'top': transform = `rotate(${angle + 180}deg) translateY(${arc}px)`; break;
        case 'left': transform = `rotate(${angle + 90}deg) translateY(${arc}px)`; break;
        case 'right': transform = `rotate(${angle - 90}deg) translateY(${arc}px)`; break;
        case 'top-left': transform = `rotate(${angle + 135}deg) translateY(${arc}px)`; break;
        case 'top-right': transform = `rotate(${angle - 135}deg) translateY(${arc}px)`; break;
        case 'bottom-left': transform = `rotate(${angle + 45}deg) translateY(${arc}px)`; break;
        case 'bottom-right': transform = `rotate(${angle - 45}deg) translateY(${arc}px)`; break;
        default: transform = `rotate(${angle}deg)`;
    }

    return { transform, zIndex: idx + 1 };
};

const getRelativeSeatInfo = (actualIndex, myIndex, numPlayers) => {
    const relIndex = (actualIndex - myIndex + numPlayers) % numPlayers;
    let positionClass, trans;
    
    if (numPlayers === 4) {
        if (relIndex === 0) { positionClass = 'bottom'; trans = 'translate(0, 60px)'; }
        else if (relIndex === 1) { positionClass = 'left'; trans = 'translate(-60px, 0)'; }
        else if (relIndex === 2) { positionClass = 'top'; trans = 'translate(0, -60px)'; }
        else if (relIndex === 3) { positionClass = 'right'; trans = 'translate(60px, 0)'; }
    } else {
        if (relIndex === 0) { positionClass = 'bottom'; trans = 'translate(0, 60px)'; }
        else if (relIndex === 1) { positionClass = 'bottom-left'; trans = 'translate(-40px, 40px)'; }
        else if (relIndex === 2) { positionClass = 'top-left'; trans = 'translate(-40px, -40px)'; }
        else if (relIndex === 3) { positionClass = 'top'; trans = 'translate(0, -60px)'; }
        else if (relIndex === 4) { positionClass = 'top-right'; trans = 'translate(40px, -40px)'; }
        else if (relIndex === 5) { positionClass = 'bottom-right'; trans = 'translate(40px, 40px)'; }
    }
    
    return { positionClass, trans, relIndex };
};

const GameTable = ({ gameState, roomState, playerId, onPlayCard, onRestart, onExit }) => {
    if (!gameState) return null;

    const numPlayers = gameState.players.length;
    const myIndex = gameState.players.findIndex(p => p.id === playerId);
    if (myIndex === -1) return <div>Player not found in this game</div>;
    
    // Compute relative layout for all players based on viewer's perspective
    const tableLayout = gameState.players.map((player, index) => {
        const { positionClass, trans, relIndex } = getRelativeSeatInfo(index, myIndex, numPlayers);
        const team = gameState.teams.find(t => t.players.some(p => p.id === player.id));
        const isLocal = player.id === playerId;
        return { player, actualIndex: index, relIndex, positionClass, trans, team, isLocal };
    });

    // Ensure DOM order maps smoothly to relIndex so z-index stacking is naturally layered.
    tableLayout.sort((a, b) => b.relIndex - a.relIndex);

    const currentTrick = gameState.currentRound?.currentTrick?.cards || [];
    const isTrickComplete = currentTrick.length === numPlayers;
    const turnPlayerId = gameState.players[gameState.currentRound?.turnIndex]?.id;
    const isMyTurn = turnPlayerId === playerId && !isTrickComplete;
    
    const renderCardFan = (layoutInfo) => {
        const { player, positionClass, isLocal } = layoutInfo;
        const count = player.hand.length || 0;
        
        if (isLocal) {
            return (
                <div className={`card-fan-container fan-${positionClass}`}>
                    {player.hand.map((card, idx) => {
                        const style = getFanStyle(idx, count, positionClass);
                        return (
                            <div key={idx} style={style} className="fanned-card-wrapper">
                                <Card card={card} onClick={(c) => isMyTurn && onPlayCard(c)} />
                            </div>
                        );
                    })}
                </div>
            );
        } else {
            const backs = [];
            for(let i = 0; i < count; i++) {
                const style = getFanStyle(i, count, positionClass);
                backs.push(<div key={i} className="card-back" style={style}></div>);
            }
            return <div className={`card-fan-container fan-${positionClass}`}>{backs}</div>;
        }
    };

    const getPlayedCard = (pId) => {
        const play = currentTrick.find(c => c.playerId === pId);
        return play ? play.card : null;
    };

    const winnerName = isTrickComplete && gameState.currentRound.currentTrick.winnerPlayerId 
        ? gameState.players.find(p => p.id === gameState.currentRound.currentTrick.winnerPlayerId)?.name 
        : null;

    const renderSeat = (layoutInfo) => (
        <div key={layoutInfo.player.id} className={`player-seat player-${layoutInfo.positionClass}`}>
            <div className={`player-info-badge glass position-${layoutInfo.positionClass}`}>
                <span className="player-name">{layoutInfo.player.name} {layoutInfo.isLocal ? '(You)' : ''}</span>
                <span className={`team-badge team-${layoutInfo.team?.id}`}>{layoutInfo.team?.name}</span>
                <span className="card-count">({layoutInfo.player.hand.length})</span>
            </div>
            {renderCardFan(layoutInfo)}
            
            {layoutInfo.isLocal && (
                <div className="turn-indicator" style={{marginTop: '1.5rem', height: '40px'}}>
                    {isMyTurn ? (
                        <div className="turn-badge active">
                            <span className="status-dot green"></span>
                            Your Turn
                        </div>
                    ) : !isTrickComplete ? (
                        <div className="turn-badge waiting">
                            Waiting for {gameState.players[gameState.currentRound?.turnIndex]?.name}'s turn...
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );

    return (
        <div className="game-container">
            <div className="table-area">
                {/* Bottom Left: Game Info (Hukum) */}
                <div className="game-info bottom-left glass">
                    <h3 style={{color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '0.2rem'}}>Round {gameState.history.length + 1}</h3>
                    {gameState.hukumSuit && (
                        <div className="hukum-display">
                            Hukum: <span style={{color: gameState.hukumSuit === 'Hearts' || gameState.hukumSuit === 'Diamonds' ? 'var(--card-red)' : 'white'}}>{gameState.hukumSuit}</span>
                        </div>
                    )}
                </div>

                {/* Top Right: Scoreboard */}
                <div className="game-info top-right glass">
                    <div style={{fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem', textAlign: 'center'}}>Mendis Collected</div>
                    <div style={{display: 'flex', gap: '2rem'}}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <div style={{color: '#3b82f6', fontWeight: 'bold', fontSize: '1.1rem'}}>Team A</div>
                            <div style={{fontSize: '1.8rem'}}>{gameState.teams[0].capturedCards.filter(c => c.isTen).length}</div>
                            <div style={{display: 'flex', gap: '4px', marginTop: '4px'}}>
                                {gameState.teams[0].capturedCards.filter(c => c.isTen).map((c, i) => {
                                    const isRed = c.suit === 'Hearts' || c.suit === 'Diamonds';
                                    const symbol = c.suit === 'Hearts' ? '♥' : c.suit === 'Diamonds' ? '♦' : c.suit === 'Clubs' ? '♣' : '♠';
                                    return <span key={i} style={{color: isRed ? '#ef4444' : 'white', fontSize: '1.2rem'}}>{symbol}</span>;
                                })}
                            </div>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <div style={{color: 'var(--card-red)', fontWeight: 'bold', fontSize: '1.1rem'}}>Team B</div>
                            <div style={{fontSize: '1.8rem'}}>{gameState.teams[1].capturedCards.filter(c => c.isTen).length}</div>
                            <div style={{display: 'flex', gap: '4px', marginTop: '4px'}}>
                                {gameState.teams[1].capturedCards.filter(c => c.isTen).map((c, i) => {
                                    const isRed = c.suit === 'Hearts' || c.suit === 'Diamonds';
                                    const symbol = c.suit === 'Hearts' ? '♥' : c.suit === 'Diamonds' ? '♦' : c.suit === 'Clubs' ? '♣' : '♠';
                                    return <span key={i} style={{color: isRed ? '#ef4444' : 'white', fontSize: '1.2rem'}}>{symbol}</span>;
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="zone-top">
                    {tableLayout.filter(l => l.positionClass === 'top').map(renderSeat)}
                </div>

                <div className="zone-middle">
                    {tableLayout.filter(l => !['top', 'bottom'].includes(l.positionClass)).map(renderSeat)}

                    <div className="play-center">
                        {/* Render Trick Cards Relative to Player Seat Position */}
                        {tableLayout.map((layoutInfo, domIdx) => {
                            const played = getPlayedCard(layoutInfo.player.id);
                            if (!played) return null;
                            
                            const isWinner = isTrickComplete && gameState.currentRound.currentTrick.winnerPlayerId === layoutInfo.player.id;
                            // Use predictable DOM order matching relIndex to maintain fixed overlap semantics
                            return (
                                <div key={layoutInfo.player.id} className={`played-card card-position-${layoutInfo.positionClass} ${isWinner ? 'winner-card' : ''}`} style={{zIndex: 10 - layoutInfo.relIndex}}>
                                    <Card card={played} isPlayed={true} />
                                </div>
                            );
                        })}
                    </div>

                    {isTrickComplete && (() => {
                        const winnerTeam = gameState.teams.find(t => t.players.some(p => p.id === gameState.currentRound.currentTrick.winnerPlayerId));
                        return (
                            <div className="trick-result-badge glass">
                                <h2 style={{color: winnerTeam?.id === 'A' ? '#3b82f6' : 'var(--card-red)'}}>
                                    {winnerTeam?.name.toUpperCase()} SCORES!
                                </h2>
                            </div>
                        );
                    })()}
                </div>

                <div className="zone-bottom">
                    {tableLayout.filter(l => l.positionClass === 'bottom').map(renderSeat)}
                </div>
            </div>

            {/* Game Over Screen */}
            {gameState.status === 'ENDED' && (() => {
                const teamA = gameState.teams[0];
                const teamB = gameState.teams[1];
                const teamATens = teamA.capturedCards.filter(c => c.isTen).length;
                const teamBTens = teamB.capturedCards.filter(c => c.isTen).length;

                let winnerText = "It's a Draw!";
                let winnerColor = '#aaaaaa';
                
                if (teamATens > teamBTens) {
                    winnerText = "TEAM A WINS!";
                    winnerColor = '#3b82f6';
                } else if (teamBTens > teamATens) {
                    winnerText = "TEAM B WINS!";
                    winnerColor = 'var(--card-red)';
                }

                const isHost = roomState?.hostId === playerId;

                return (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'white', backdropFilter: 'blur(8px)'
                    }}>
                        <div className="glass" style={{
                            padding: '3rem',
                            borderRadius: '16px',
                            border: `2px solid ${winnerColor}`,
                            boxShadow: `0 0 40px ${winnerColor}40`,
                            textAlign: 'center',
                            minWidth: '500px'
                        }}>
                            <h1 className="title-ornate" style={{ fontSize: '3.5rem', color: winnerColor, textShadow: '0 0 20px rgba(0,0,0,0.5)', marginBottom: '2rem' }}>
                                {winnerText}
                            </h1>
                            
                            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-around', gap: '2rem' }}>
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', flex: 1 }}>
                                    <h3 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1.5rem' }}>Team A ({teamATens} Mendis)</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2rem' }}>
                                        {teamA.players.map(p => (
                                            <li key={p.id} style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{p.name}</span>
                                                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>+{teamATens}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', flex: 1 }}>
                                    <h3 style={{ color: 'var(--card-red)', marginBottom: '1rem', fontSize: '1.5rem' }}>Team B ({teamBTens} Mendis)</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2rem' }}>
                                        {teamB.players.map(p => (
                                            <li key={p.id} style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{p.name}</span>
                                                <span style={{ fontWeight: 'bold', color: 'var(--card-red)' }}>+{teamBTens}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                {isHost && (
                                    <button onClick={onRestart} className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
                                        Restart Game (Lobby)
                                    </button>
                                )}
                                <button onClick={onExit} className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: '#333', border: '1px solid #555', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                                    Exit to Dashboard
                                </button>
                            </div>
                            {!isHost && (
                                <p style={{ marginTop: '1rem', color: '#aaa', fontStyle: 'italic' }}>Waiting for host to restart...</p>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default GameTable;
