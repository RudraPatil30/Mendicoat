const { Deck } = require('./Deck');

class GameState {
    constructor(roomId) {
        this.roomId = roomId;
        this.teams = [];
        this.players = [];
        this.hukumSuit = null;
        this.currentRound = null;
        this.status = 'LOBBY';
        this.history = [];
    }

    setTeams(team1, team2) {
        this.teams = [team1, team2];
    }

    setPlayers(players) {
        if (players.length !== 4 && players.length !== 6) throw new Error("Game requires exactly 4 or 6 players");
        this.players = players;
    }

    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
}

module.exports = GameState;
