import type { EmptyObject } from '@game/shared';
import { TypedEvent } from '../utils/typed-emitter';
import type { CARD_EVENTS, CREATURE_EVENTS } from './card.enums';
import type { Creature, SerializedCreature } from './entities/creature.entity';
import type { Hero, SerializedHero } from './entities/hero.entity';
import type { AnyCard, SerializedCard } from './entities/card.entity';
import type { SerializedEvolution } from './entities/evolution.entity';
import type { Damage, Defender } from '../combat/damage';

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

export class CreatureAttackEvent extends TypedEvent<
  { target: Creature | Hero },
  { target: SerializedCreature | SerializedHero }
> {
  serialize() {
    return {
      target: this.data.target.serialize()
    };
  }
}

export class CreatureBlockEvent extends TypedEvent<
  { attacker: Creature },
  { attacker: SerializedCreature }
> {
  serialize() {
    return {
      attacker: this.data.attacker.serialize()
    };
  }
}

export class CreatureDestroyedEvent extends TypedEvent<
  { source: AnyCard },
  { source: SerializedCard }
> {
  serialize() {
    return {
      source: this.data.source.serialize()
    };
  }
}

export class CreatureBeforeDealDamageEvent extends TypedEvent<
  { target: Defender },
  { target: SerializedCreature | SerializedHero | SerializedEvolution }
> {
  serialize() {
    return {
      target: this.data.target.serialize()
    };
  }
}

export class CreatureAfterDealDamageEvent extends TypedEvent<
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

export class CreatureTakeDamageEvent extends TypedEvent<
  { source: AnyCard; target: Defender; damage: Damage },
  {
    source: SerializedCard;
    amount: number;
    target: SerializedCreature | SerializedHero | SerializedEvolution;
  }
> {
  serialize() {
    return {
      source: this.data.source.serialize(),
      target: this.data.target.serialize(),
      amount: this.data.damage.getFinalAmount(this.data.target)
    };
  }
}

export type CardEventMap = {
  [CARD_EVENTS.BEFORE_PLAY]: CardBeforePlayEvent;
  [CARD_EVENTS.AFTER_PLAY]: CardAfterPlayEvent;
};

export type CreatureEventMap = CardEventMap & {
  [CREATURE_EVENTS.BEFORE_ATTACK]: CreatureAttackEvent;
  [CREATURE_EVENTS.AFTER_ATTACK]: CreatureAttackEvent;
  [CREATURE_EVENTS.BEFORE_BLOCK]: CreatureBlockEvent;
  [CREATURE_EVENTS.AFTER_BLOCK]: CreatureBlockEvent;
  [CREATURE_EVENTS.BEFORE_DESTROYED]: CreatureDestroyedEvent;
  [CREATURE_EVENTS.AFTER_DESTROYED]: CreatureDestroyedEvent;
  [CREATURE_EVENTS.BEFORE_DEAL_DAMAGE]: CreatureBeforeDealDamageEvent;
  [CREATURE_EVENTS.AFTER_DEAL_DAMAGE]: CreatureAfterDealDamageEvent;
  [CREATURE_EVENTS.BEFORE_TAKE_DAMAGE]: CreatureTakeDamageEvent;
  [CREATURE_EVENTS.AFTER_TAKE_DAMAGE]: CreatureTakeDamageEvent;
};

export type SpellEventMap = CardEventMap;
export type ShardEventMap = CardEventMap;
export type EvolutionEventMap = CardEventMap;
export type HeroEventMap = CardEventMap;
