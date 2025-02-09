import { Entity } from '../entity';
import { type Game } from '../game/game';
import { type EmptyObject, type Point, type Serializable } from '@game/shared';
import { PLAYER_EVENTS } from './player-enums';

type CardOptions = {
  blueprintId: string;
};

type Card = any;

export type PlayerOptions = {
  id: string;
  name: string;
  deck: { general: CardOptions; cards: CardOptions[] };
  generalPosition: Point;
};

export type SerializedPlayer = {
  id: string;
  name: string;
};

export type PlayerEventMap = {
  [PLAYER_EVENTS.START_TURN]: [{ id: string }];
  [PLAYER_EVENTS.END_TURN]: [{ id: string }];
  [PLAYER_EVENTS.BEFORE_DRAW]: [{ amount: number }];
  [PLAYER_EVENTS.AFTER_DRAW]: [{ cards: Card[] }];
  [PLAYER_EVENTS.BEFORE_PLAY_CARD]: [{ card: Card; targets: Point[] }];
  [PLAYER_EVENTS.AFTER_PLAY_CARD]: [{ card: Card; targets: Point[] }];
  [PLAYER_EVENTS.BEFORE_MANA_CHANGE]: [{ amount: number }];
  [PLAYER_EVENTS.AFTER_MANA_CHANGE]: [{ amount: number }];
  [PLAYER_EVENTS.MULLIGAN]: [{ id: string }];
};

export class Player
  extends Entity<PlayerEventMap, EmptyObject>
  implements Serializable<SerializedPlayer>
{
  private game: Game;

  constructor(
    game: Game,
    private options: PlayerOptions
  ) {
    super(options.id, {});
    this.game = game;
  }

  serialize() {
    return {
      id: this.id,
      name: this.options.name
    };
  }
}
