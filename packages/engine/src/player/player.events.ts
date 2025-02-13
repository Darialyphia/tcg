import type { EmptyObject } from '@game/shared';
import { TypedEvent } from '../utils/typed-emitter';
import type { PLAYER_EVENTS } from './player-enums';
import type { SerializedSpell, Spell } from '../card/entities/spell.entity';
import type { Creature, SerializedCreature } from '../card/entities/creature.entity';
import type { SerializedShard, Shard } from '../card/entities/shard.entity';
import type { Evolution, SerializedEvolution } from '../card/entities/evolution.entity';
import type { SerializedCard } from '../card/entities/card.entity';
import type { DeckCard } from '../card/entities/deck.entity';
import { replace } from 'lodash-es';

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
  { card: SerializedCreature | SerializedSpell | SerializedShard }
> {
  serialize() {
    return {
      card: this.data.card.serialize()
    };
  }
}

export class PlayerBeforeReplaceCardEvent extends TypedEvent<
  { card: DeckCard },
  { card: SerializedCreature | SerializedSpell | SerializedShard }
> {
  serialize() {
    return {
      card: this.data.card.serialize()
    };
  }
}

export class PlayerAfterReplaceCardEvent extends TypedEvent<
  { card: DeckCard; replacement: DeckCard },
  {
    card: SerializedCreature | SerializedSpell | SerializedShard;
    replacement: SerializedCreature | SerializedSpell | SerializedShard;
  }
> {
  serialize() {
    return {
      card: this.data.card.serialize(),
      replacement: this.data.replacement.serialize()
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
  [PLAYER_EVENTS.BEFORE_REPLACE_CARD]: PlayerBeforeReplaceCardEvent;
  [PLAYER_EVENTS.AFTER_REPLACE_CARD]: PlayerAfterReplaceCardEvent;
};
