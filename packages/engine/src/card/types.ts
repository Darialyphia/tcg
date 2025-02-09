import type { GameState } from '../game/types';
import type { IPlayer, PlayerId } from '../player/types';

export type ICard = {
  id: string;
  player: IPlayer;
  name: string;
  manaCost: number;
  type: 'Creature' | 'Spell' | 'Artifact';
  targetRules: TargetRule[];
  onPlay: (game: GameState, selectedTargets: Target[]) => void;
};

export type TargetRule = {
  condition?: (game: GameState, selectedTargets: Target[]) => Target[];
  required: boolean;
};

type Target =
  | PlayerId
  | { cardId: string }
  | { zone: 'Graveyard' | 'Hand'; playerId: PlayerId };
export type ICreatureCard = ICard & {
  attack: number;
  defense: number;
};
