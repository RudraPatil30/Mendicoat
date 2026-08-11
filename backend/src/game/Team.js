class Team {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.players = [];
        this.capturedCards = [];
    }

    addPlayer(player) {
        if (this.players.length >= 2) throw new Error("Team is already full");
        this.players.push(player);
    }

    captureTrick(cards) {
        this.capturedCards.push(...cards);
    }

    getCapturedTensCount() {
        return this.capturedCards.filter(c => c.isTen).length;
    }
}

module.exports = Team;
