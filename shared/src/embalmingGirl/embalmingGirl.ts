import { EmbalmingGirlState, Card} from './types';
import { moves } from './moves';
import { setup } from './setup';
import { playerView } from './playerView';
import { turn } from './turn';
import { Game } from 'boardgame.io';


export const EmbalmingGirlGame: Game<EmbalmingGirlState> = {
    name: 'embalming-girl',
    disableUndo: false,
    setup: setup,
    events: {
      endStage: true,
      endGame: true,
      endPhase: true,
      endTurn: true,
      setPhase: true,
      setStage: true,
      // pass: true;
      setActivePlayers: true
    },
    moves: moves,
    turn: turn,
    phases: {
        main: {
            start: true,
            turn: turn,
        },
    },
    playerView: playerView
};