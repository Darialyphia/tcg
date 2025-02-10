import { Card, type AnyCard, type CardOptions } from './card.entity';
import type { CreatureBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import type { CreatureEventMap } from '../card.events';
import type { Attacker, Damage, Defender } from '../../utils/damage';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';

export type SerializedCreature = {
  id: string;
};

const makeInterceptors = () => ({
  canAttack: new Interceptable<boolean, { target: Defender }>(),
  canBlock: new Interceptable<boolean, { attacker: Attacker }>(),
  canBeAttackTarget: new Interceptable<boolean, { attacker: Attacker }>(),

  manaCost: new Interceptable<number>(),
  maxHp: new Interceptable<number>(),
  atk: new Interceptable<number>(),

  damageDealt: new Interceptable<number, { target: Defender }>(),
  damageReceived: new Interceptable<
    number,
    { amount: number; source: AnyCard; damage: Damage<AnyCard> }
  >()
});
type CreatureInterceptors = ReturnType<typeof makeInterceptors>;

export class Creature extends Card<
  SerializedCreature,
  CreatureEventMap,
  CreatureInterceptors,
  CreatureBlueprint
> {
  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
  }

  get atk(): number {
    return this.interceptors.atk.getValue(this.blueprint.atk, {});
  }

  get maxHp(): number {
    return this.interceptors.maxHp.getValue(this.blueprint.maxHp, {});
  }

  get manaCost() {
    return this.interceptors.manaCost.getValue(this.blueprint.manaCost, {});
  }

  get job() {
    return this.blueprint.job;
  }

  getDealtDamage(target: Defender) {
    return this.interceptors.damageDealt.getValue(this.atk, {
      target
    });
  }

  getReceivedDamage<T extends AnyCard>(amount: number, damage: Damage<T>, from: AnyCard) {
    return this.interceptors.damageReceived.getValue(amount, {
      source: from,
      damage,
      amount
    });
  }

  play() {}

  serialize() {
    return {
      id: this.id
    };
  }
}
