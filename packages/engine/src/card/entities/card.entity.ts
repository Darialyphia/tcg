import { type JSONObject, type Point3D } from '@game/shared';
import { Entity } from '../../entity';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import type { CardBlueprint } from '../card-blueprint';
import type { CARD_EVENTS } from '../card.enums';
import type { CardAfterPlayEvent, CardBeforePlayEvent } from '../card.events';

export type CardOptions = {
  id: string;
  blueprint: CardBlueprint;
};

export type CardEventMap = {
  [CARD_EVENTS.BEFORE_PLAY]: CardBeforePlayEvent;
  [CARD_EVENTS.AFTER_PLAY]: CardAfterPlayEvent;
};

export type AnyCard = Card<any, any, any, any>;

export abstract class Card<
  TSerialized extends JSONObject,
  TEventMap extends CardEventMap,
  TInterceptors extends Record<string, any> = Record<string, any>,
  TBlueprint extends CardBlueprint = CardBlueprint
> extends Entity<TEventMap, TInterceptors> {
  protected game: Game;

  protected blueprint: TBlueprint;

  readonly player: Player;

  constructor(
    game: Game,
    player: Player,
    interceptors: TInterceptors,
    options: CardOptions
  ) {
    super(options.id, interceptors);
    this.game = game;
    this.player = player;
    // @ts-expect-error
    this.blueprint = options.blueprint;
  }

  get blueprintId() {
    return this.blueprint.id;
  }

  get kind() {
    return this.blueprint.kind;
  }

  get imageId() {
    return this.blueprint.imageId;
  }

  get name() {
    return this.blueprint.name;
  }

  get description() {
    return this.blueprint.description;
  }

  get rarity() {
    return this.blueprint.rarity;
  }

  get faction() {
    return this.blueprint.faction;
  }

  abstract play(): void;

  abstract serialize(): TSerialized;

  shutdown() {
    this.emitter.removeAllListeners();
  }
}
