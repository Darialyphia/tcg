// augments the paylod of an event with additional data
// for example: a unit may emit a AFTER_MOVE event without a reference to itself
// but the global event UNIT_AFTER_MOVE will have a reference to the unit who moved

import type { AnyObject, Constructor, Prettify, Values } from '@game/shared';
import { InputSystem, type SerializedInput } from '../input/input-system';
import type { RngSystem } from '../rng/rng-system';
import { defaultConfig, type Config } from '../config';
import { TypedEventEmitter } from '../utils/typed-emitter';

// this type represents that in a generic way
type EnrichEvent<TTuple extends [...any[]], TAdditional extends AnyObject> = {
  [Index in keyof TTuple]: TTuple[Index] extends AnyObject
    ? TTuple[Index] & TAdditional
    : TTuple;
} & { length: TTuple['length'] };

type GameEventsBase = {
  'game.input-start': [SerializedInput];
  'game.input-queue-flushed': [];
  'game.error': [{ error: Error }];
  'game.ready': [];
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

export const GAME_EVENTS = {
  ERROR: 'game.error',
  READY: 'game.ready',
  FLUSHED: 'game.input-queue-flushed',
  INPUT_START: 'game.input-start'
} as const satisfies Record<string, keyof GameEventMap>;

export type GameOptions = {
  id: string;
  rngSeed: string;
  rngCtor: Constructor<RngSystem>;
  mapId: string;
  history?: SerializedInput[];
  configOverrides: Partial<Config>;
};

export class Game {
  private readonly emitter = new TypedEventEmitter<GameEventMap>();

  readonly rngSystem: RngSystem;

  readonly inputSystem = new InputSystem(this);

  readonly config: Config;

  readonly id: string;
  isSimulation = false;
  constructor(readonly options: GameOptions) {
    this.id = options.id;
    this.config = Object.assign({}, defaultConfig, options.configOverrides);
    this.rngSystem = new options.rngCtor(this);
    this.setupStarEvents();
  }

  makeLogger(topic: string, color: string) {
    return (...messages: any[]) => {
      console.groupCollapsed(`%c[${this.id}][${topic}]`, `color: ${color}`);
      console.log(...messages);
      console.groupEnd();
    };
  }

  // the event emitter doesnt provide the event name if you enable wildcards, so let's implement it ourselves
  private setupStarEvents() {
    Object.values(GAME_EVENTS).forEach(eventName => {
      this.on(eventName as any, event => {
        // this.makeLogger(eventName, 'black')(event);

        this.emit('*', { eventName, event } as any);
      });
    });
  }

  initialize() {
    this.rngSystem.initialize({ seed: this.options.rngSeed });
    this.inputSystem.initialize(this.options.history ?? []);

    this.emit(GAME_EVENTS.READY);
  }

  get on() {
    return this.emitter.on.bind(this.emitter);
  }

  get once() {
    return this.emitter.once.bind(this.emitter);
  }

  get off() {
    return this.emitter.off.bind(this.emitter);
  }

  get emit() {
    return this.emitter.emit.bind(this.emitter);
  }

  dispatch(input: SerializedInput) {
    return this.inputSystem.dispatch(input);
  }

  shutdown() {
    this.emitter.removeAllListeners();
  }

  clone(id: number) {
    const game = new Game({
      ...this.options,
      id: `simulation_${id}`,
      history: this.inputSystem.serialize()
    });
    game.initialize();

    return game;
  }
}
