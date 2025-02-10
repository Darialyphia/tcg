import { Card, type CardOptions, type SerializedCard } from './card.entity';
import type { ShardBlueprint } from '../card-blueprint';
import type { ShardEventMap } from '../card.events';
import type { EmptyObject } from '@game/shared';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';

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
  }

  play() {}

  serialize() {
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
