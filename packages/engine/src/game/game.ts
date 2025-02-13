import { InputSystem, type SerializedInput } from '../input/input-system';
import { defaultConfig, type Config } from '../config';
import { TypedEventEmitter } from '../utils/typed-emitter';
import { RngSystem } from '../rng/rng.system';
import { PlayerSystem } from '../player/player.system';
import { GAME_EVENTS, GameReadyEvent, type GameEventMap } from './game.events';
import { GameBoardSystem } from './systems/game-board.system';
import { GamePhaseSystem } from './systems/game-phase.system';
import { GameSnaphotSystem } from './systems/game-snapshot.system';
import { InteractionSystem } from './systems/interaction.system';
import { TurnSystem } from './systems/turn.system';
import { EffectChainSystem } from './systems/effect-chain.system';

export type GameOptions = {
  id: string;
  rngSeed: string;
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

  readonly interaction = new InteractionSystem(this);

  readonly effectChainSystem = new EffectChainSystem(this);

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
    this.interaction.initialize();
    this.board.initialize();
    this.serializer.initialize();
    this.turnSystem.initialize();
    this.effectChainSystem.initialize();

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
