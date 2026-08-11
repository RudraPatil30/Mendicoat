const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
// Ranks mapped to values for easier comparison (2 = 2, A = 14)
const RANKS = [
    { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
    { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
    { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 10 },
    { rank: 'J', value: 11 }, { rank: 'Q', value: 12 }, { rank: 'K', value: 13 },
    { rank: 'A', value: 14 }
];

class Deck {
    constructor() {
        this.cards = [];
        this.initialize();
    }

    initialize() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rankObj of RANKS) {
                this.cards.push({
                    suit: suit,
                    rank: rankObj.rank,
                    value: rankObj.value,
                    isTen: rankObj.rank === '10'
                });
            }
        }
    }

    shuffle() {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(players) {
        if (players.length !== 4) throw new Error("Must have 4 players to deal.");
        this.shuffle();
        let pIndex = 0;
        for (let i = 0; i < this.cards.length; i++) {
            players[pIndex].addCards([this.cards[i]]);
            pIndex = (pIndex + 1) % 4;
        }
        this.cards = []; // Deck is empty after dealing all 52 cards
    }
}

module.exports = { Deck, SUITS, RANKS };
