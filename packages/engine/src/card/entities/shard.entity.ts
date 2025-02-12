import { Card, type CardOptions, type SerializedCard } from './card.entity';
import type { ShardBlueprint } from '../card-blueprint';
import {
  CardAfterPlayEvent,
  CardBeforePlayEvent,
  type ShardEventMap
} from '../card.events';
import type { EmptyObject } from '@game/shared';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { GameCardEvent } from '../../game/game.events';
import { SHARD_EVENTS } from '../card.enums';

export type SerializedShard = SerializedCard;

type ShardInterceptors = EmptyObject;

export class Shard extends Card<
  SerializedShard,
  ShardEventMap,
  ShardInterceptors,
  ShardBlueprint
> {
  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, {}, options);
    this.forwardListeners();
  }

  play() {
    this.emitter.emit(SHARD_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
    this.player.boardSide.placeShard(this);
    this.blueprint.onPlay(this.game, this);
    this.emitter.emit(SHARD_EVENTS.AFTER_PLAY, new CardAfterPlayEvent({}));
  }

  forwardListeners() {
    Object.values(SHARD_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `card.${eventName}`,
          new GameCardEvent({ card: this, event: event as any }) as any
        );
      });
    });
  }

  serialize(): SerializedShard {
    return {
      id: this.id,
      name: this.name,
      imageId: this.imageId,
      description: this.description,
      set: this.set,
      faction: this.faction?.serialize() ?? null,
      kind: this.kind,
      rarity: this.rarity
    };
  }
}
