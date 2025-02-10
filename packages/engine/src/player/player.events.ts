import type { EmptyObject, Values } from '@game/shared';
import { TypedEvent } from '../utils/typed-emitter';
import type { PLAYER_EVENTS } from './player-enums';

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

export class PlayerBeforeManaChangeEvent extends TypedEvent<
  { amount: number },
  { amount: number }
> {
  serialize() {
    return {
      amount: this.data.amount
    };
  }
}

export class PlayerAfterManaChangeEvent extends TypedEvent<
  { amount: number },
  { amount: number }
> {
  serialize() {
    return {
      amount: this.data.amount
    };
  }
}

export type PlayerEventMap = {
  [PLAYER_EVENTS.START_TURN]: PlayerStartTurnEvent;
  [PLAYER_EVENTS.END_TURN]: PlayerEndTurnEvent;
  [PLAYER_EVENTS.BEFORE_MANA_CHANGE]: PlayerBeforeManaChangeEvent;
  [PLAYER_EVENTS.AFTER_MANA_CHANGE]: PlayerAfterManaChangeEvent;
};
