const Trick = require('./Trick');

class Round {
    constructor(dealerIndex, maxPlayers = 4) {
        this.tricks = [];
        this.currentTrick = null;
        this.dealerIndex = dealerIndex;
        this.maxPlayers = maxPlayers;
        this.maxTricks = maxPlayers === 6 ? 8 : 13;
        this.turnIndex = (dealerIndex + 1) % this.maxPlayers; 
    }

    startNewTrick(leadPlayerId) {
        this.currentTrick = new Trick(leadPlayerId, this.maxPlayers);
        this.tricks.push(this.currentTrick);
    }

    getCompletedTricks() {
        return this.tricks.filter(t => t.isFull());
    }

    isRoundComplete() {
        return this.tricks.length === this.maxTricks && this.currentTrick.isFull();
    }
}

module.exports = Round;
