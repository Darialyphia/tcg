import type { EmptyObject } from '@game/shared';
import { TypedEvent } from '../utils/typed-emitter';
import type { CARD_EVENTS, CREATURE_CARD_EVENTS } from './card.enums';
import type { Creature, SerializedCreature } from './entities/creature.entity';
import type { Hero, SerializedHero } from './entities/hero.entity';

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

export type CardEventMap = {
  [CARD_EVENTS.BEFORE_PLAY]: CardBeforePlayEvent;
  [CARD_EVENTS.AFTER_PLAY]: CardAfterPlayEvent;
};

export type CreatureEventMap = CardEventMap & {
  [CREATURE_CARD_EVENTS.BEFORE_ATTACK]: CreatureAttackEvent;
};

export type SpellEventMap = CardEventMap;
export type ShardEventMap = CardEventMap;
export type EvolutionEventMap = CardEventMap;
export type HeroEventMap = CardEventMap;
