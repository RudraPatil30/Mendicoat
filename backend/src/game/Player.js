class Player {
    constructor(id, name, teamId) {
        this.id = id;
        this.name = name;
        this.teamId = teamId;
        this.hand = [];
    }

    addCards(cards) {
        this.hand.push(...cards);
    }

    removeCard(cardToRemove) {
        const index = this.hand.findIndex(c => c.suit === cardToRemove.suit && c.rank === cardToRemove.rank);
        if (index !== -1) {
            this.hand.splice(index, 1);
            return true;
        }
        return false;
    }

    hasSuit(suit) {
        return this.hand.some(c => c.suit === suit);
    }
}

module.exports = Player;
