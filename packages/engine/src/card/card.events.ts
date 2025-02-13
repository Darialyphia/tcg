import type { EmptyObject } from '@game/shared';
import { TypedEvent } from '../utils/typed-emitter';
import type { CARD_EVENTS, CREATURE_EVENTS } from './card.enums';
import type { Creature, SerializedCreature } from './entities/creature.entity';
import type { Hero, SerializedHero } from './entities/hero.entity';
import type { AnyCard, SerializedCard } from './entities/card.entity';
import type { SerializedEvolution } from './entities/evolution.entity';
import type { Attacker, Damage, Defender } from '../combat/damage';

export class CardBeforePlayEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class CardAfterPlayEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class AttackEvent extends TypedEvent<
  { target: Defender },
  { target: SerializedCreature | SerializedEvolution | SerializedHero }
> {
  serialize() {
    return {
      target: this.data.target.serialize()
    };
  }
}

export class BlockEvent extends TypedEvent<
  { attacker: Attacker },
  { attacker: SerializedCreature }
> {
  serialize() {
    return {
      attacker: this.data.attacker.serialize()
    };
  }
}

export class DestroyedEvent extends TypedEvent<
  { source: AnyCard },
  { source: SerializedCard }
> {
  serialize() {
    return {
      source: this.data.source.serialize()
    };
  }
}

export class BeforeDealDamageEvent extends TypedEvent<
  { target: Defender },
  { target: SerializedCreature | SerializedHero | SerializedEvolution }
> {
  serialize() {
    return {
      target: this.data.target.serialize()
    };
  }
}

export class AfterDealDamageEvent extends TypedEvent<
  { target: Defender; damage: Damage },
  { target: SerializedCreature | SerializedHero | SerializedEvolution; amount: number }
> {
  serialize() {
    return {
      target: this.data.target.serialize(),
      amount: this.data.damage.getFinalAmount(this.data.target)
    };
  }
}

export class TakeDamageEvent extends TypedEvent<
  { source: AnyCard; target: Defender; damage: Damage },
  {
    source: SerializedCard;
    amount: number;
  }
> {
  serialize() {
    return {
      source: this.data.source.serialize(),
      amount: this.data.damage.getFinalAmount(this.data.target)
    };
  }
}

export type CardEventMap = {
  [CARD_EVENTS.BEFORE_PLAY]: CardBeforePlayEvent;
  [CARD_EVENTS.AFTER_PLAY]: CardAfterPlayEvent;
};

export type CreatureEventMap = CardEventMap & {
  [CREATURE_EVENTS.BEFORE_ATTACK]: AttackEvent;
  [CREATURE_EVENTS.AFTER_ATTACK]: AttackEvent;
  [CREATURE_EVENTS.BEFORE_BLOCK]: BlockEvent;
  [CREATURE_EVENTS.AFTER_BLOCK]: BlockEvent;
  [CREATURE_EVENTS.BEFORE_DESTROYED]: DestroyedEvent;
  [CREATURE_EVENTS.AFTER_DESTROYED]: DestroyedEvent;
  [CREATURE_EVENTS.BEFORE_DEAL_DAMAGE]: BeforeDealDamageEvent;
  [CREATURE_EVENTS.AFTER_DEAL_DAMAGE]: AfterDealDamageEvent;
  [CREATURE_EVENTS.BEFORE_TAKE_DAMAGE]: TakeDamageEvent;
  [CREATURE_EVENTS.AFTER_TAKE_DAMAGE]: TakeDamageEvent;
};

export type SpellEventMap = CardEventMap;
export type ShardEventMap = CardEventMap;
export type EvolutionEventMap = CardEventMap & {
  [CREATURE_EVENTS.BEFORE_ATTACK]: AttackEvent;
  [CREATURE_EVENTS.AFTER_ATTACK]: AttackEvent;
  [CREATURE_EVENTS.BEFORE_BLOCK]: BlockEvent;
  [CREATURE_EVENTS.AFTER_BLOCK]: BlockEvent;
  [CREATURE_EVENTS.BEFORE_DESTROYED]: DestroyedEvent;
  [CREATURE_EVENTS.AFTER_DESTROYED]: DestroyedEvent;
  [CREATURE_EVENTS.BEFORE_DEAL_DAMAGE]: BeforeDealDamageEvent;
  [CREATURE_EVENTS.AFTER_DEAL_DAMAGE]: AfterDealDamageEvent;
  [CREATURE_EVENTS.BEFORE_TAKE_DAMAGE]: TakeDamageEvent;
  [CREATURE_EVENTS.AFTER_TAKE_DAMAGE]: TakeDamageEvent;
};
export type HeroEventMap = CardEventMap;
