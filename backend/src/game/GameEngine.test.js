const GameEngine = require('./GameEngine');
const Team = require('./Team');
const Player = require('./Player');

describe('GameEngine - Game Ending on All Mendis Collected', () => {
    let engine;
    let t1, t2;
    let p1, p2, p3, p4;

    beforeEach(() => {
        engine = new GameEngine('ROOM1');
        t1 = new Team('A', 'Team A', 2);
        t2 = new Team('B', 'Team B', 2);
        p1 = new Player('p1', 'Player 1', 'A');
        p2 = new Player('p2', 'Player 2', 'B');
        p3 = new Player('p3', 'Player 3', 'A');
        p4 = new Player('p4', 'Player 4', 'B');
        t1.addPlayer(p1);
        t1.addPlayer(p3);
        t2.addPlayer(p2);
        t2.addPlayer(p4);
        engine.initializeGame(t1, t2);
    });

    test('areAllMendisCollected returns false initially', () => {
        expect(engine.areAllMendisCollected()).toBe(false);
    });

    test('Game does not end if fewer than 4 mendis collected and round is not complete', () => {
        // Clear hands to setup specific trick
        engine.gameState.players.forEach(p => p.hand = []);
        p1.addCards([{ suit: 'Spades', rank: '10', value: 10, isTen: true }]);
        p2.addCards([{ suit: 'Spades', rank: '2', value: 2, isTen: false }]);
        p3.addCards([{ suit: 'Spades', rank: '3', value: 3, isTen: false }]);
        p4.addCards([{ suit: 'Spades', rank: '4', value: 4, isTen: false }]);

        // p1 turn
        engine.gameState.currentRound.turnIndex = 0;
        engine.playCard('p1', { suit: 'Spades', rank: '10', value: 10, isTen: true });
        engine.playCard('p2', { suit: 'Spades', rank: '2', value: 2, isTen: false });
        engine.playCard('p3', { suit: 'Spades', rank: '3', value: 3, isTen: false });
        const res = engine.playCard('p4', { suit: 'Spades', rank: '4', value: 4, isTen: false });

        expect(res.trickComplete).toBe(true);
        engine.handleTrickCompletion();

        expect(engine.areAllMendisCollected()).toBe(false);
        expect(engine.gameState.status).toBe('PLAYING');
        expect(t1.getCapturedTensCount()).toBe(1);
    });

    test('Game ends immediately after 4th mendi is collected', () => {
        // Simulate 3 mendis already captured
        t1.captureTrick([
            { suit: 'Spades', rank: '10', value: 10, isTen: true },
            { suit: 'Hearts', rank: '10', value: 10, isTen: true },
            { suit: 'Diamonds', rank: '10', value: 10, isTen: true }
        ]);

        expect(engine.areAllMendisCollected()).toBe(false);

        // Play a trick with the 4th mendi (Clubs 10)
        engine.gameState.players.forEach(p => p.hand = []);
        p1.addCards([{ suit: 'Clubs', rank: 'A', value: 14, isTen: false }]);
        p2.addCards([{ suit: 'Clubs', rank: '10', value: 10, isTen: true }]);
        p3.addCards([{ suit: 'Clubs', rank: '2', value: 2, isTen: false }]);
        p4.addCards([{ suit: 'Clubs', rank: '3', value: 3, isTen: false }]);

        engine.gameState.currentRound.turnIndex = 0;
        engine.playCard('p1', { suit: 'Clubs', rank: 'A', value: 14, isTen: false });
        engine.playCard('p2', { suit: 'Clubs', rank: '10', value: 10, isTen: true });
        engine.playCard('p3', { suit: 'Clubs', rank: '2', value: 2, isTen: false });
        const res = engine.playCard('p4', { suit: 'Clubs', rank: '3', value: 3, isTen: false });

        expect(res.trickComplete).toBe(true);
        engine.handleTrickCompletion();

        // Total tens captured is now 4 (all mendis collected)
        expect(engine.areAllMendisCollected()).toBe(true);
        expect(engine.gameState.status).toBe('ENDED');
        expect(engine.gameState.history.length).toBe(1);
        expect(engine.gameState.history[0].team1Tens).toBe(4);
        expect(engine.gameState.history[0].team2Tens).toBe(0);
    });
});
