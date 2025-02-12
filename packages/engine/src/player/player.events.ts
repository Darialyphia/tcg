import type { EmptyObject } from '@game/shared';
import { TypedEvent } from '../utils/typed-emitter';
import type { PLAYER_EVENTS } from './player-enums';
import type { SerializedSpell, Spell } from '../card/entities/spell.entity';
import type { Creature, SerializedCreature } from '../card/entities/creature.entity';
import type { SerializedShard, Shard } from '../card/entities/shard.entity';
import type { Evolution } from '../card/entities/evolution.entity';
import type { SerializedCard } from '../card/entities/card.entity';

export class PlayerStartTurnEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class PlayerEndTurnEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class PlayerManaChangeEvent extends TypedEvent<
  { amount: number },
  { amount: number }
> {
  serialize() {
    return {
      amount: this.data.amount
    };
  }
}

export class PlayCardEvent extends TypedEvent<
  { card: Creature | Evolution | Spell | Shard },
  { card: SerializedCard }
> {
  serialize() {
    return {
      card: this.data.card.serialize()
    };
  }
}

export type PlayerEventMap = {
  [PLAYER_EVENTS.START_TURN]: PlayerStartTurnEvent;
  [PLAYER_EVENTS.END_TURN]: PlayerEndTurnEvent;
  [PLAYER_EVENTS.BEFORE_MANA_CHANGE]: PlayerManaChangeEvent;
  [PLAYER_EVENTS.AFTER_MANA_CHANGE]: PlayerManaChangeEvent;
  [PLAYER_EVENTS.BEFORE_PLAY_CARD]: PlayCardEvent;
  [PLAYER_EVENTS.AFTER_PLAY_CARD]: PlayCardEvent;
};
