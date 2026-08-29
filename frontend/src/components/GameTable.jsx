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

const GameTable = ({ gameState, playerId, onPlayCard }) => {
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

    return (
        <div className="game-container">
            {/* Top Left: Game Info */}
            <div className="game-info top-left glass">
                <h3 style={{color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '0.2rem'}}>Round {gameState.history.length + 1}</h3>
                {gameState.hukumSuit && (
                    <div className="hukum-display">
                        Hukum: <span style={{color: gameState.hukumSuit === 'Hearts' || gameState.hukumSuit === 'Diamonds' ? 'var(--card-red)' : 'white'}}>{gameState.hukumSuit}</span>
                    </div>
                )}
            </div>

            {/* Top Right: Scoreboard */}
            <div className="game-info top-right glass">
                <div style={{display: 'flex', gap: '2rem'}}>
                    <div>
                        <div style={{color: '#3b82f6', fontWeight: 'bold', fontSize: '1.1rem'}}>Team A</div>
                        <div style={{fontSize: '1.8rem'}}>{gameState.teams[0].capturedCards.filter(c => c.isTen).length}</div>
                    </div>
                    <div>
                        <div style={{color: 'var(--card-red)', fontWeight: 'bold', fontSize: '1.1rem'}}>Team B</div>
                        <div style={{fontSize: '1.8rem'}}>{gameState.teams[1].capturedCards.filter(c => c.isTen).length}</div>
                    </div>
                </div>
            </div>

            <div className="table-area">
                {/* Render All Seats Using Local Perspective */}
                {tableLayout.map(layoutInfo => (
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
                ))}

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
        </div>
    );
};

export default GameTable;
