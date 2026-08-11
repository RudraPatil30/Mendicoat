class RuleEngine {
    static isValidMove(player, card, currentTrick) {
        // Must actually have the card
        if (!player.hasSuit(card.suit) || !player.hand.some(c => c.suit === card.suit && c.rank === card.rank)) {
            return false;
        }

        // If it's the first card of the trick, any card is valid
        if (!currentTrick || currentTrick.cards.length === 0) {
            return true;
        }

        const leadSuit = currentTrick.leadSuit;

        // Follow suit if possible
        if (player.hasSuit(leadSuit)) {
            if (card.suit === leadSuit) {
                return true;
            } else {
                return false; // Illegal: Has the lead suit but didn't play it
            }
        }

        // Cannot follow suit, so any card is valid
        return true;
    }

    static determineTrickWinner(trick, hukumSuit) {
        if (!trick.isFull()) throw new Error("Cannot determine winner of an incomplete trick.");

        let winningCardPlay = trick.cards[0];
        
        for (let i = 1; i < trick.cards.length; i++) {
            const currentPlay = trick.cards[i];
            const currentCard = currentPlay.card;
            const winningCard = winningCardPlay.card;

            if (hukumSuit !== null) {
                if (currentCard.suit === hukumSuit) {
                    if (winningCard.suit === hukumSuit) {
                        if (currentCard.value > winningCard.value) {
                            winningCardPlay = currentPlay;
                        }
                    } else {
                        winningCardPlay = currentPlay;
                    }
                } else {
                    if (winningCard.suit !== hukumSuit) {
                         if (currentCard.suit === trick.leadSuit && currentCard.suit === winningCard.suit) {
                             if (currentCard.value > winningCard.value) {
                                 winningCardPlay = currentPlay;
                             }
                         }
                    }
                }
            } else {
                // No Hukum established yet
                // Only cards of the lead suit can win
                if (currentCard.suit === trick.leadSuit && winningCard.suit === trick.leadSuit) {
                    if (currentCard.value > winningCard.value) {
                        winningCardPlay = currentPlay;
                    }
                }
            }
        }

        return winningCardPlay.playerId;
    }
}

module.exports = RuleEngine;
