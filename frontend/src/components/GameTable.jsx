import React from 'react';
import Card from './Card';

const GameTable = ({ gameState, playerId, onPlayCard }) => {
    if (!gameState) return null;

    const myPlayer = gameState.players.find(p => p.id === playerId);
    const myIndex = gameState.players.findIndex(p => p.id === playerId);
    
    // For a spectator or unmatched case
    if (!myPlayer) return <div>Player not found in this game</div>;

    const leftIndex = (myIndex + 1) % 4;
    const topIndex = (myIndex + 2) % 4;
    const rightIndex = (myIndex + 3) % 4;

    const leftPlayer = gameState.players[leftIndex];
    const topPlayer = gameState.players[topIndex];
    const rightPlayer = gameState.players[rightIndex];

    const currentTrick = gameState.currentRound?.currentTrick?.cards || [];
    const turnPlayerId = gameState.players[gameState.currentRound?.turnIndex]?.id;
    const isMyTurn = turnPlayerId === playerId;

    const renderCardBacks = (count) => {
        const backs = [];
        for(let i=0; i<count; i++) {
            backs.push(<div key={i} className="card-back shadow-md"></div>);
        }
        return backs;
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
                <div className="player-top">
                    <div style={{display: 'flex'}}>
                        {renderCardBacks(topPlayer.hand.length || 0)}
                    </div>
                </div>

                <div className="player-left">
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {renderCardBacks(leftPlayer.hand.length || 0)}
                    </div>
                </div>

                <div className="play-center">
                    {getPlayedCard(topPlayer.id) && (
                        <div className="played-card" style={{transform: 'translateY(-60px)'}}>
                            <Card card={getPlayedCard(topPlayer.id)} isPlayed={true} />
                        </div>
                    )}
                    {getPlayedCard(leftPlayer.id) && (
                        <div className="played-card" style={{transform: 'translateX(-60px)'}}>
                            <Card card={getPlayedCard(leftPlayer.id)} isPlayed={true} />
                        </div>
                    )}
                    {getPlayedCard(rightPlayer.id) && (
                        <div className="played-card" style={{transform: 'translateX(60px)'}}>
                            <Card card={getPlayedCard(rightPlayer.id)} isPlayed={true} />
                        </div>
                    )}
                    {getPlayedCard(myPlayer.id) && (
                        <div className="played-card" style={{transform: 'translateY(60px)'}}>
                            <Card card={getPlayedCard(myPlayer.id)} isPlayed={true} />
                        </div>
                    )}
                </div>

                <div className="player-right">
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {renderCardBacks(rightPlayer.hand.length || 0)}
                    </div>
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
