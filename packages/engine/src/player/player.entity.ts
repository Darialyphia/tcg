import { Entity } from '../entity';
import { type Game } from '../game/game';
import { type EmptyObject, type Point, type Serializable } from '@game/shared';
import type { PlayerEventMap } from './player.events';

type CardOptions = {
  blueprintId: string;
};

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

  get opponent() {
    return this.game.playerSystem.players.find(p => !p.equals(this))!;
  }

  startTurn() {}
}
