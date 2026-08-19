import React from 'react';
import Card from './Card';

const GameTable = ({ gameState, playerId, onPlayCard }) => {
    if (!gameState) return null;

    const myPlayer = gameState.players.find(p => p.id === playerId);
    const myIndex = gameState.players.findIndex(p => p.id === playerId);
    
    // For a spectator or unmatched case
    if (!myPlayer) return <div>Player not found in this game</div>;

    const numPlayers = gameState.players.length;
    const opponentLayout = [];
    
    for(let i=1; i<numPlayers; i++) {
        const pIndex = (myIndex + i) % numPlayers;
        const player = gameState.players[pIndex];
        let cssClass, trans;
        
        if (numPlayers === 4) {
            if (i === 1) { cssClass = 'player-left'; trans = 'translateX(-60px)'; }
            else if (i === 2) { cssClass = 'player-top'; trans = 'translateY(-60px)'; }
            else if (i === 3) { cssClass = 'player-right'; trans = 'translateX(60px)'; }
        } else {
            if (i === 1) { cssClass = 'player-bottom-left'; trans = 'translate(-40px, 40px)'; }
            else if (i === 2) { cssClass = 'player-top-left'; trans = 'translate(-40px, -40px)'; }
            else if (i === 3) { cssClass = 'player-top'; trans = 'translateY(-60px)'; }
            else if (i === 4) { cssClass = 'player-top-right'; trans = 'translate(40px, -40px)'; }
            else if (i === 5) { cssClass = 'player-bottom-right'; trans = 'translate(40px, 40px)'; }
        }
        opponentLayout.push({ player, cssClass, trans });
    }

    const currentTrick = gameState.currentRound?.currentTrick?.cards || [];
    const turnPlayerId = gameState.players[gameState.currentRound?.turnIndex]?.id;
    const isMyTurn = turnPlayerId === playerId;

    const renderCardBacks = (count, cssClass) => {
        const backs = [];
        for(let i=0; i<count; i++) {
            backs.push(<div key={i} className="card-back shadow-md"></div>);
        }
        const isHorizontal = cssClass === 'player-top';
        return (
            <div style={{display: 'flex', flexDirection: isHorizontal ? 'row' : 'column'}}>
                {backs}
            </div>
        );
    };

    const getPlayedCard = (pId) => {
        const play = currentTrick.find(c => c.playerId === pId);
        return play ? play.card : null;
    };

    return (
        <div className="game-container">
            <div className="game-info glass">
                <h2>Room: {gameState.roomId}</h2>
                <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                    <div style={{textAlign: 'center'}}>
                        <p style={{color: 'var(--text-muted)'}}>Team A (10s)</p>
                        <h3>{gameState.teams[0].capturedCards.filter(c => c.isTen).length}</h3>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <p style={{color: 'var(--text-muted)'}}>Team B (10s)</p>
                        <h3>{gameState.teams[1].capturedCards.filter(c => c.isTen).length}</h3>
                    </div>
                </div>
                {gameState.hukumSuit && (
                    <div className="hukum-display">
                        Hukum: <span style={{color: gameState.hukumSuit === 'Hearts' || gameState.hukumSuit === 'Diamonds' ? 'var(--card-red)' : 'white'}}>{gameState.hukumSuit}</span>
                    </div>
                )}
            </div>

            <div className="table-area">
                
                {opponentLayout.map(opp => (
                    <div key={opp.player.id} className={opp.cssClass}>
                        {renderCardBacks(opp.player.hand.length || 0, opp.cssClass)}
                    </div>
                ))}

                <div className="play-center">
                    {/* Render Opponent Trick Cards */}
                    {opponentLayout.map(opp => {
                        const played = getPlayedCard(opp.player.id);
                        if (!played) return null;
                        return (
                            <div key={opp.player.id} className="played-card" style={{transform: opp.trans}}>
                                <Card card={played} isPlayed={true} />
                            </div>
                        );
                    })}

                    {/* Render My Trick Card */}
                    {getPlayedCard(myPlayer.id) && (
                        <div className="played-card" style={{transform: 'translateY(60px)'}}>
                            <Card card={getPlayedCard(myPlayer.id)} isPlayed={true} />
                        </div>
                    )}
                </div>

                <div className="player-bottom">
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        {isMyTurn ? (
                            <h3 style={{color: 'var(--accent)', marginBottom: '10px', animation: 'pulse 1.5s infinite'}}>Your Turn!</h3>
                        ) : (
                            <h3 style={{color: 'var(--text-muted)', marginBottom: '10px'}}>Waiting for {gameState.players[gameState.currentRound?.turnIndex]?.name}'s turn...</h3>
                        )}
                        <div style={{display: 'flex'}}>
                            {myPlayer.hand.map((card, idx) => (
                                <Card 
                                    key={idx} 
                                    card={card} 
                                    onClick={(c) => isMyTurn && onPlayCard(c)} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameTable;
