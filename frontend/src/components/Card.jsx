import React from 'react';

const suits = {
    Hearts: '♥',
    Diamonds: '♦',
    Clubs: '♣',
    Spades: '♠'
};

const Card = ({ card, onClick, isPlayed }) => {
    const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
    const colorClass = isRed ? 'red' : 'black';
    const symbol = suits[card.suit];

    return (
        <div 
            className={`card ${colorClass} ${isPlayed ? 'played-card glass' : ''}`}
            onClick={() => onClick && onClick(card)}
        >
            <div className="card-top-left">
                <span>{card.rank}</span>
                <span>{symbol}</span>
            </div>
            <div className="card-center">
                {symbol}
            </div>
            <div className="card-bottom-right">
                <span>{card.rank}</span>
                <span>{symbol}</span>
            </div>
        </div>
    );
};

export default Card;
