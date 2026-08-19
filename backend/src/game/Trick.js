class Trick {
    constructor(leadPlayerId, maxPlayers = 4) {
        this.leadPlayerId = leadPlayerId;
        this.maxPlayers = maxPlayers;
        this.cards = []; // Array of { playerId, card }
        this.leadSuit = null;
        this.winnerPlayerId = null;
    }

    playCard(playerId, card) {
        if (this.isFull()) throw new Error("Trick is already full");
        
        if (this.cards.length === 0) {
            this.leadSuit = card.suit;
        }
        
        this.cards.push({ playerId, card });
    }

    isFull() {
        return this.cards.length === this.maxPlayers;
    }
}

module.exports = Trick;
