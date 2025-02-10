import type { EmptyObject, Prettify, Values } from '@game/shared';
import type { SerializedInput } from '../input/input-system';
import { TypedEvent } from '../utils/typed-emitter';
import type { Input } from '../input/input';
import { TURN_EVENTS, type TurnEventMap } from './turn-system';
import type { PlayerEventMap } from '../player/player.events';
import type { Player, SerializedPlayer } from '../player/player.entity';
import { mapKeys, mapValues } from 'lodash-es';
import { PLAYER_EVENTS } from '../player/player-enums';
// augments the paylod of an event with additional data
// for example: a unit may emit a AFTER_MOVE event without a reference to itself
// but the global event UNIT_AFTER_MOVE will have a reference to the unit who moved
// this type represents that in a generic way
// type EnrichEvent<TTuple extends [...any[]], TAdditional extends AnyObject> = {
//   [Index in keyof TTuple]: TTuple[Index] extends AnyObject
//     ? TTuple[Index] & TAdditional
//     : TTuple;
// } & { length: TTuple['length'] };

// type GlobalPlayerEvents = {
//   [Event in PlayerEvent as `player.${Event}`]: EnrichEvent<
//     PlayerEventMap[Event],
//     { player: Player }
//   >;
// };

export class GamePlayerEvent<TEvent extends Values<PlayerEventMap>> extends TypedEvent<
  { player: Player; event: TEvent },
  ReturnType<TEvent['serialize']> & { player: SerializedPlayer }
> {
  serialize() {
    return {
      ...(this.data.event.serialize() as any),
      player: this.data.player.serialize()
    } as ReturnType<TEvent['serialize']> & { player: SerializedPlayer };
  }
}

export class GameInputStartEvent extends TypedEvent<
  { input: Input<any> },
  SerializedInput
> {
  serialize() {
    return this.data.input.serialize();
  }
}

export class GameInputQueueFlushedEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class GameErrorEvent extends TypedEvent<{ error: Error }, { error: string }> {
  serialize() {
    return { error: this.data.error.message };
  }
}

export class GameReadyEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class GameStarEvent<
  T extends Exclude<GameEventName, '*'> = Exclude<GameEventName, '*'>
> extends TypedEvent<{ e: StarEvent<T> }, SerializedStarEvent> {
  get eventName() {
    return this.data.e.eventName;
  }

  get event() {
    return this.data.e.event;
  }

  serialize() {
    return {
      eventName: this.data.e.eventName,
      event: this.data.e.event.serialize()
    } as any;
  }
}

type GameEventsBase = {
  'game.input-start': GameInputStartEvent;
  'game.input-queue-flushed': GameInputQueueFlushedEvent;
  'game.error': GameErrorEvent;
  'game.ready': GameReadyEvent;
  '*': GameStarEvent;
};
type GamePlayerEventMap = {
  [Event in keyof PlayerEventMap as `player.${Event}`]: GamePlayerEvent<
    PlayerEventMap[Event]
  >;
};

export type GameEventMap = Prettify<GameEventsBase & TurnEventMap & GamePlayerEventMap>;
export type GameEventName = keyof GameEventMap;
export type GameEvent = Values<GameEventMap>;

export type StarEvent<
  T extends Exclude<GameEventName, '*'> = Exclude<GameEventName, '*'>
> = {
  eventName: T;
  event: GameEventMap[T];
};

export type SerializedStarEvent = Values<{
  [Name in Exclude<GameEventName, '*'>]: {
    eventName: Name;
    event: ReturnType<GameEventMap[Name]['serialize']>;
  };
}>;

const makeGlobalEvents = <TDict extends Record<string, string>, TPrefix extends string>(
  eventDict: TDict,
  prefix: TPrefix
) =>
  mapKeys(
    mapValues(eventDict, evt => `${prefix}.${evt}`),
    (value, key) => `${prefix.toUpperCase()}_${key}`
  ) as {
    [Key in string &
      keyof TDict as `${Uppercase<TPrefix>}_${Key}`]: `${TPrefix}.${TDict[Key]}`;
  };

export const GAME_EVENTS = {
  ERROR: 'game.error',
  READY: 'game.ready',
  FLUSHED: 'game.input-queue-flushed',
  INPUT_START: 'game.input-start',
  TURN_START: TURN_EVENTS.TURN_START,
  TURN_END: TURN_EVENTS.TURN_END,
  ...makeGlobalEvents(PLAYER_EVENTS, 'player')
} as const satisfies Record<string, keyof GameEventMap>;
