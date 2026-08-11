const Trick = require('./Trick');

class Round {
    constructor(dealerIndex) {
        this.tricks = [];
        this.currentTrick = null;
        this.dealerIndex = dealerIndex;
        this.turnIndex = (dealerIndex + 1) % 4; 
    }

    startNewTrick(leadPlayerId) {
        this.currentTrick = new Trick(leadPlayerId);
        this.tricks.push(this.currentTrick);
    }

    getCompletedTricks() {
        return this.tricks.filter(t => t.isFull());
    }

    isRoundComplete() {
        return this.tricks.length === 13 && this.currentTrick.isFull();
    }
}

module.exports = Round;
