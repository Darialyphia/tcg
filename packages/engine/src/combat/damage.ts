import type { BetterOmit, Values } from '@game/shared';
import type { AnyCard } from '../card/entities/card.entity';
import type { Creature } from '../card/entities/creature.entity';
import type { Hero } from '../card/entities/hero.entity';
import type { Spell } from '../card/entities/spell.entity';

export const DAMAGE_TYPES = {
  COMBAT: 'COMBAT',
  ABILITY: 'ABILITY',
  SPELL: 'SPELL',
  LOYALTY: 'LOYALTY'
} as const;

export type DamageType = Values<typeof DAMAGE_TYPES>;

export type Attacker = Creature;
export type Defender = Creature | Hero;
export type Blocker = Creature;

export type DamageOptions<T extends AnyCard> = {
  source: T;
  baseAmount: number;
  type: DamageType;
};

export abstract class Damage<T extends AnyCard = AnyCard> {
  protected _source: T;

  protected _baseAmount: number;

  readonly type: DamageType;

  constructor(options: DamageOptions<T>) {
    this._source = options.source;
    this._baseAmount = options.baseAmount;
    this.type = options.type;
  }

  get baseAmount() {
    return this._baseAmount;
  }

  get source() {
    return this._source;
  }

  abstract getFinalAmount(target: Defender): number;
  abstract getFinalAmount(target: Defender): number;
}

export class CombatDamage extends Damage<Attacker> {
  constructor(options: BetterOmit<DamageOptions<Attacker>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.COMBAT });
  }

  getFinalAmount(target: Defender) {
    const scaled = this._source.getDealtDamage(target);

    return target.getReceivedDamage(scaled, this, this._source);
  }
}

export class SpellDamage extends Damage<Spell> {
  constructor(options: BetterOmit<DamageOptions<Spell>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.SPELL });
  }

  getFinalAmount(target: Defender) {
    return target.getReceivedDamage(this.baseAmount, this, this._source);
  }
}

export class AbilityDamage extends Damage<AnyCard> {
  constructor(options: BetterOmit<DamageOptions<AnyCard>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.ABILITY });
  }

  getFinalAmount(target: Defender) {
    return target.getReceivedDamage(this.baseAmount, this, this._source);
  }
}

export class LoyaltyDamage extends Damage<AnyCard> {
  constructor(options: BetterOmit<DamageOptions<AnyCard>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.LOYALTY });
  }

  getFinalAmount() {
    return this.baseAmount;
  }
}
