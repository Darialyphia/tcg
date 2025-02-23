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
import { LoyaltyDamage } from '../../combat/damage';
import { ModifierManager } from '../components/modifier-manager.component';
import type { Modifier } from './modifier.entity';

export type SerializedShard = SerializedCard;

type ShardInterceptors = EmptyObject;

export class Shard extends Card<
  SerializedShard,
  ShardEventMap,
  ShardInterceptors,
  ShardBlueprint
> {
  readonly modifierManager: ModifierManager<Shard>;

  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, {}, options);
    this.modifierManager = new ModifierManager(this);
    this.forwardListeners();
    this.blueprint.onInit(this.game, this);
  }

  get loyalty() {
    return this.blueprint.loyalty;
  }

  get loyaltyCost() {
    if (this.faction?.equals(this.player.hero.faction)) {
      return 0;
    } else {
      return 1 + this.loyalty;
    }
  }

  play() {
    this.emitter.emit(SHARD_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
    this.player.hero.receiveDamage(
      new LoyaltyDamage({ baseAmount: this.loyaltyCost, source: this })
    );
    this.player.boardSide.placeShard(this);
    this.blueprint.onPlay(this.game, this);
    this.emitter.emit(SHARD_EVENTS.AFTER_PLAY, new CardAfterPlayEvent({}));
  }

  get removeModifier() {
    return this.modifierManager.remove.bind(this.modifierManager);
  }

  get hasModifier() {
    return this.modifierManager.has.bind(this.modifierManager);
  }

  get getModifier() {
    return this.modifierManager.get.bind(this.modifierManager);
  }

  get modifiers() {
    return this.modifierManager.modifiers;
  }

  addModifier(modifier: Modifier<Shard>) {
    this.modifierManager.add(modifier);

    return () => this.removeModifier(modifier.id);
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
      faction: this.faction?.serialize() ?? null,
      kind: this.kind,
      rarity: this.rarity
    };
  }
}
