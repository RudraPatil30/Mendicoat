const { Deck } = require('./Deck');
const GameState = require('./GameState');
const Round = require('./Round');
const RuleEngine = require('./RuleEngine');

class GameEngine {
    constructor(roomId) {
        this.gameState = new GameState(roomId);
    }

    initializeGame(players, team1, team2) {
        this.gameState.setTeams(team1, team2);
        this.gameState.setPlayers(players);
        this.gameState.status = 'DEALING';
        this.startRound();
    }

    startRound() {
        const dealerIndex = this.gameState.history.length % 4;
        this.gameState.currentRound = new Round(dealerIndex);
        this.gameState.hukumSuit = null;

        const deck = new Deck();
        deck.deal(this.gameState.players);
        
        this.gameState.status = 'PLAYING';
        this.gameState.currentRound.startNewTrick(this.gameState.players[this.gameState.currentRound.turnIndex].id);
    }

    playCard(playerId, card) {
        if (this.gameState.status !== 'PLAYING') {
            throw new Error("Game is not in PLAYING state.");
        }

        const round = this.gameState.currentRound;
        const currentTrick = round.currentTrick;
        const currentPlayerId = this.gameState.players[round.turnIndex].id;

        if (playerId !== currentPlayerId) {
            throw new Error("Not your turn.");
        }

        const player = this.gameState.getPlayer(playerId);
        
        if (!RuleEngine.isValidMove(player, card, currentTrick)) {
            throw new Error("Illegal move. Must follow suit if possible.");
        }

        if (currentTrick.cards.length > 0 && this.gameState.hukumSuit === null) {
            if (card.suit !== currentTrick.leadSuit) {
                this.gameState.hukumSuit = card.suit;
            }
        }

        player.removeCard(card);
        currentTrick.playCard(playerId, card);

        if (currentTrick.isFull()) {
            this.handleTrickCompletion();
        } else {
            round.turnIndex = (round.turnIndex + 1) % 4;
        }

        return { success: true };
    }

    handleTrickCompletion() {
        const round = this.gameState.currentRound;
        const currentTrick = round.currentTrick;

        const winnerId = RuleEngine.determineTrickWinner(currentTrick, this.gameState.hukumSuit);
        const winnerTeam = this.gameState.teams.find(t => t.players.some(p => p.id === winnerId));

        winnerTeam.captureTrick(currentTrick.cards.map(cPlay => cPlay.card));
        currentTrick.winnerPlayerId = winnerId;

        if (round.isRoundComplete()) {
            this.handleRoundCompletion();
        } else {
            const winnerIndex = this.gameState.players.findIndex(p => p.id === winnerId);
            round.turnIndex = winnerIndex;
            round.startNewTrick(winnerId);
        }
    }

    handleRoundCompletion() {
        this.gameState.status = 'ENDED';
        const team1Score = this.gameState.teams[0].getCapturedTensCount();
        const team2Score = this.gameState.teams[1].getCapturedTensCount();

        this.gameState.history.push({
            team1Tens: team1Score,
            team2Tens: team2Score
        });
    }
}

module.exports = GameEngine;
