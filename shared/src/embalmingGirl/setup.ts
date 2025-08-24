import { EmbalmingGirlState } from './types';
import { DefaultPluginAPIs, Ctx } from 'boardgame.io';

export function setup(context: DefaultPluginAPIs & {
        ctx: Ctx;
    }, setupData: any): EmbalmingGirlState {
  const playerCount = context.ctx.numPlayers;
  const ifHelpRemember = setupData?.ifHelpRemember ?? false;

  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: i.toString(),
    isReady: false,
    handCards: { cards: [], belong: i.toString() },
    imprisonedCards: { cards: [] },
    viewedHarmonyCards: { cards: [] },
    viewedHandCards: [],
    ready: false,
  }));

  return {
    players,
    harmonyCards: { cards: [] },
    playedCards: { cards: [] },
    firstPlayer: null,
    ifHelpRemember,
    gameStarted: false,
    interactInfo: []
  };
}