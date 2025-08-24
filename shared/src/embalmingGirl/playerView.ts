import { EmbalmingGirlState, Card } from './types';

export function playerView({ G, playerID }: any): EmbalmingGirlState {
    const newG: EmbalmingGirlState = JSON.parse(JSON.stringify(G));
    newG.players = newG.players.map((player) => {
        if (player.handCards?.cards) {
            player.handCards.cards = player.handCards.cards.map((card: Card) => {
                if (card.condition === 'hand') {
                    return {
                        ...card,
                        condition: (player.id === playerID) ? 'up' as const: 'down' as const,
                    };
                }
                return card;
            });
        }
        return player;
    });
    return newG;
}