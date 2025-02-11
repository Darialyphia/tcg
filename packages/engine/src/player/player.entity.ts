import { Entity } from '../entity';
import { type Game } from '../game/game';
import { type EmptyObject, type Point, type Serializable } from '@game/shared';
import type { PlayerEventMap } from './player.events';
import { PLAYER_EVENTS } from './player-enums';
import { GamePlayerEvent } from '../game/game.events';

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
    this.forwardListeners;
  }

  serialize() {
    return {
      id: this.id,
      name: this.options.name
    };
  }

  forwardListeners() {
    Object.values(PLAYER_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `player.${eventName}`,
          new GamePlayerEvent({ player: this, event }) as any
        );
      });
    });
  }

  get opponent() {
    return this.game.playerSystem.players.find(p => !p.equals(this))!;
  }

  startTurn() {}
}
