class Team {
    constructor(id, name, maxPlayers = 2) {
        this.id = id;
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.capturedCards = [];
    }

    addPlayer(player) {
        if (this.players.length >= this.maxPlayers) throw new Error("Team is already full");
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
