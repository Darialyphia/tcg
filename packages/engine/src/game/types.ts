import type { ICard } from '../card/types';
import type { PlayerId, IPlayer } from '../player/types';

export type GameState = {
  players: Record<PlayerId, IPlayer>;
  stack: ICard[];
  currentPhase: 'MAIN' | 'COMBAT' | 'BLOCKING' | 'RESPONSE' | 'END';
  activePlayer: PlayerId;
  turnOrder: PlayerId[];
};
