import type { AnyObject, Prettify, Values } from '@game/shared';
import { InputSystem, type SerializedInput } from '../input/input-system';
import { defaultConfig, type Config } from '../config';
import { TypedEventEmitter } from '../utils/typed-emitter';
import { RngSystem } from '../rng/rng.system';
import { GamePhaseSystem } from './game-phase.system';
import { GameSnaphotSystem } from './game-snapshot.system';
import { PLAYER_EVENTS, type PlayerEvent } from '../player/player-enums';
import type { Player, PlayerEventMap } from '../player/player.entity';
import { mapKeys, mapValues } from 'lodash-es';
import { PlayerSystem } from '../player/player.system';

// augments the paylod of an event with additional data
// for example: a unit may emit a AFTER_MOVE event without a reference to itself
// but the global event UNIT_AFTER_MOVE will have a reference to the unit who moved
// this type represents that in a generic way
type EnrichEvent<TTuple extends [...any[]], TAdditional extends AnyObject> = {
  [Index in keyof TTuple]: TTuple[Index] extends AnyObject
    ? TTuple[Index] & TAdditional
    : TTuple;
} & { length: TTuple['length'] };

type GlobalPlayerEvents = {
  [Event in PlayerEvent as `player.${Event}`]: EnrichEvent<
    PlayerEventMap[Event],
    { player: Player }
  >;
};

type GameEventsBase = {
  'game.input-start': [SerializedInput];
  'game.input-queue-flushed': [];
  'game.error': [{ error: Error }];
  'game.ready': [];
  '*': [e: StarEvent];
};

export type GameEventMap = Prettify<GameEventsBase & GlobalPlayerEvents>;
export type GameEventName = keyof GameEventMap;
export type GameEvent = Values<GameEventMap>;

export type StarEvent<
  T extends Exclude<GameEventName, '*'> = Exclude<GameEventName, '*'>
> = {
  eventName: T;
  event: GameEventMap[T];
};

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
  ...makeGlobalEvents(PLAYER_EVENTS, 'player')
} as const satisfies Record<string, keyof GameEventMap>;

export type GameOptions = {
  id: string;
  rngSeed: string;
  mapId: string;
  history?: SerializedInput[];
  configOverrides: Partial<Config>;
};

export class Game {
  readonly id: string;

  private readonly emitter = new TypedEventEmitter<GameEventMap>();

  readonly config: Config;

  readonly rngSystem = new RngSystem(this);

  readonly inputSystem = new InputSystem(this);

  readonly playerSystem = new PlayerSystem(this);

  readonly gamePhaseSystem = new GamePhaseSystem(this);

  readonly serializer = new GameSnaphotSystem(this);

  constructor(readonly options: GameOptions) {
    this.id = options.id;
    this.config = Object.assign({}, defaultConfig, options.configOverrides);
    this.setupStarEvents();
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
    this.gamePhaseSystem.initialize();
    this.playerSystem.initialize({} as any);
    this.serializer.initialize();

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

  get phase() {
    return this.gamePhaseSystem.phase;
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
