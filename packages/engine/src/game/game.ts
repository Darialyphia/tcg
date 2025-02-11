import { InputSystem, type SerializedInput } from '../input/input-system';
import { defaultConfig, type Config } from '../config';
import { TypedEventEmitter } from '../utils/typed-emitter';
import { RngSystem } from '../rng/rng.system';
import { GamePhaseSystem } from './game-phase.system';
import { GameSnaphotSystem } from './game-snapshot.system';
import { PlayerSystem } from '../player/player.system';
import { GAME_EVENTS, GameReadyEvent, type GameEventMap } from './game.events';
import { TurnSystem } from './turn-system';
import { GameBoardSystem } from './game-board.system';

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

  readonly board = new GameBoardSystem(this);

  readonly turnSystem = new TurnSystem(this);

  readonly serializer = new GameSnaphotSystem(this);

  isSimulation = false;

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
    this.board.initialize();
    this.serializer.initialize();
    this.turnSystem.initialize();

    this.emit(GAME_EVENTS.READY, new GameReadyEvent({}));
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
