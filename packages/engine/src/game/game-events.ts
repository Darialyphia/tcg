import type { EmptyObject, Prettify, Values } from '@game/shared';
import type { SerializedInput } from '../input/input-system';
import { TypedEvent } from '../utils/typed-emitter';
import type { Input } from '../input/input';
import type { G } from 'vitest/dist/chunks/reporters.D7Jzd9GS';
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

export class GameInputStartEvent extends TypedEvent<
  { input: Input<any> },
  SerializedInput
> {
  serialize() {
    return this.payload.input.serialize();
  }
}

export class GameInputQueueFlushedEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class GameErrorEvent extends TypedEvent<{ error: Error }, { error: string }> {
  serialize() {
    return { error: this.payload.error.message };
  }
}

export class GameReadyEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class GameStarEvent extends TypedEvent<{ e: StarEvent }, { eventName: string }> {
  serialize() {
    return { eventName: this.payload.e.eventName };
  }
}

type GameEventsBase = {
  'game.input-start': [GameInputStartEvent];
  'game.input-queue-flushed': [GameInputQueueFlushedEvent];
  'game.error': [GameErrorEvent];
  'game.ready': [G];
  '*': [e: StarEvent];
};

export type GameEventMap = Prettify<GameEventsBase>;
export type GameEventName = keyof GameEventMap;
export type GameEvent = Values<GameEventMap>;

export type StarEvent<
  T extends Exclude<GameEventName, '*'> = Exclude<GameEventName, '*'>
> = {
  eventName: T;
  event: GameEventMap[T];
};

// const makeGlobalEvents = <TDict extends Record<string, string>, TPrefix extends string>(
//   eventDict: TDict,
//   prefix: TPrefix
// ) =>
//   mapKeys(
//     mapValues(eventDict, evt => `${prefix}.${evt}`),
//     (value, key) => `${prefix.toUpperCase()}_${key}`
//   ) as {
//     [Key in string &
//       keyof TDict as `${Uppercase<TPrefix>}_${Key}`]: `${TPrefix}.${TDict[Key]}`;
//   };

export const GAME_EVENTS = {
  ERROR: 'game.error',
  READY: 'game.ready',
  FLUSHED: 'game.input-queue-flushed',
  INPUT_START: 'game.input-start'
} as const satisfies Record<string, keyof GameEventMap>;
