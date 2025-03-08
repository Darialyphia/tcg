import { assert, type EmptyObject } from '@game/shared';
import { Entity } from '../../entity';
import type { Game } from '../../game/game';
import type { ModifierMixin } from '../modifier-mixins/modifier-mixin';
import type { AnyCard } from './card.entity';
import type { Shard } from './shard.entity';
import type { Creature } from './creature.entity';
import type { Hero } from './hero.entity';
import type { Spell } from './spell.entity';

export type ModifierInfos = {
  name?: string;
  description?: string;
};

export type ModifierOptions = ModifierInfos & {
  mixins: ModifierMixin<ModifierTarget>[];
} & (
    | {
        stackable: true;
        initialStacks: number;
      }
    | {
        stackable: false;
      }
  );

export type ModifierTarget = Creature | Hero | Spell | Shard;

export class Modifier<TCard extends ModifierTarget> extends Entity<
  EmptyObject,
  EmptyObject
> {
  private mixins: ModifierMixin<TCard>[];

  protected game: Game;

  readonly source: AnyCard;

  protected _stacks: number;

  protected stackable: boolean;

  protected _target!: TCard;

  readonly infos: ModifierInfos;

  constructor(id: string, game: Game, source: AnyCard, options: ModifierOptions) {
    super(id, {});
    this.game = game;
    this.source = source;
    this.mixins = options.mixins;
    this.stackable = options.stackable;
    this._stacks = options.stackable ? options.initialStacks : -1;
    this.infos = {
      description: options.description,
      name: options.name
    };
  }

  get on() {
    return this.emitter.on.bind(this.emitter);
  }

  get once() {
    return this.emitter.once.bind(this.emitter);
  }

  get off() {
    return this.emitter.off.bind(this.emitter);
  }

  get target() {
    return this._target;
  }

  get stacks() {
    return this._stacks ?? 0;
  }

  addStacks(amount: number) {
    assert(this.stackable, `Modifier ${this.id} is not stackable`);
    this._stacks += amount;
  }

  removeStacks(amount: number) {
    assert(this.stackable, `Modifier ${this.id} is not stackable`);
    this._stacks -= amount;
    if (this._stacks === 0) {
      this._target.removeModifier(this.id);
    }
  }

  applyTo(card: TCard) {
    this._target = card;
    this.mixins.forEach(mixin => {
      mixin.onApplied(card, this);
    });
  }

  reapplyTo(card: TCard, newStacks?: number) {
    if (this.stackable) {
      this._stacks += newStacks ?? 1;
    }

    this.mixins.forEach(mixin => {
      mixin.onReapplied(card, this);
    });
  }

  remove() {
    this.mixins.forEach(mixin => {
      mixin.onRemoved(this._target, this);
    });
  }
}
