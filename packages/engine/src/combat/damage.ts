import type { BetterOmit, Values } from '@game/shared';
import type { AnyCard } from '../card/entities/card.entity';
import type { Creature } from '../card/entities/creature.entity';
import type { Hero } from '../card/entities/hero.entity';
import type { Evolution } from '../card/entities/evolution.entity';
import type { Spell } from '../card/entities/spell.entity';

export const DAMAGE_TYPES = {
  COMBAT: 'COMBAT',
  ABILITY: 'ABILITY',
  SPELL: 'SPELL'
} as const;

export type DamageType = Values<typeof DAMAGE_TYPES>;

export type Attacker = Creature | Evolution;
export type Defender = Creature | Evolution | Hero;

export type DamageOptions<T extends AnyCard> = {
  source: T;
  baseAmount: number;
  type: DamageType;
};

export abstract class Damage<T extends AnyCard = AnyCard> {
  protected source: T;

  protected _baseAmount: number;

  readonly type: DamageType;

  constructor(options: DamageOptions<T>) {
    this.source = options.source;
    this._baseAmount = options.baseAmount;
    this.type = options.type;
  }

  get baseAmount() {
    return this._baseAmount;
  }

  abstract getFinalAmount(target: Defender): number;
  abstract getFinalAmount(target: Defender): number;
}

export class CombatDamage extends Damage<Attacker> {
  constructor(options: BetterOmit<DamageOptions<Attacker>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.COMBAT });
  }

  getFinalAmount(target: Defender) {
    const scaled = this.source.getDealtDamage(target);

    return target.getReceivedDamage(scaled, this, this.source);
  }
}

export class SpellDamage extends Damage<Spell> {
  constructor(options: BetterOmit<DamageOptions<Spell>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.SPELL });
  }

  getFinalAmount(target: Defender) {
    return target.getReceivedDamage(this.baseAmount, this, this.source);
  }
}

export class AbilityDamage extends Damage<AnyCard> {
  constructor(options: BetterOmit<DamageOptions<AnyCard>, 'type'>) {
    super({ ...options, type: DAMAGE_TYPES.ABILITY });
  }

  getFinalAmount(target: Defender) {
    return target.getReceivedDamage(this.baseAmount, this, this.source);
  }
}
