import React from 'react';

// Load all card images eagerly using Vite's glob import
const cardImages = import.meta.glob('../assets/PNG-cards-1.3/*.png', { eager: true, import: 'default' });

const getCardImage = (rank, suit) => {
    let rankName = rank.toString().toLowerCase();
    if (rank === 'J') rankName = 'jack';
    else if (rank === 'Q') rankName = 'queen';
    else if (rank === 'K') rankName = 'king';
    else if (rank === 'A') rankName = 'ace';
    
    // The "2" suffix versions are the highly detailed traditional face card artworks
    let suffix = '';
    if (['J', 'Q', 'K'].includes(rank)) suffix = '2';
    if (rank === 'A' && suit === 'Spades') suffix = '2'; // Usually the ornate Ace of Spades

    const path = `../assets/PNG-cards-1.3/${rankName}_of_${suit.toLowerCase()}${suffix}.png`;
    return cardImages[path];
};

const Card = ({ card, onClick, isPlayed }) => {
    const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
    const colorClass = isRed ? 'red' : 'black';
    const imageSrc = getCardImage(card.rank, card.suit);

    return (
        <div 
            className={`card ${colorClass} ${isPlayed ? 'played' : ''}`}
            onClick={() => onClick && onClick(card)}
        >
            {imageSrc ? (
                <img 
                    src={imageSrc} 
                    alt={`${card.rank} of ${card.suit}`} 
                    className="card-image"
                    draggable="false"
                />
            ) : (
                <div style={{color: 'red', fontSize: '0.8rem'}}>Missing: {card.rank} {card.suit}</div>
            )}
        </div>
    );
};

export default Card;
