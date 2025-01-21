import {
  type BetterOmit,
  type Nullable,
  type PartialBy,
  type Point3D
} from '@game/shared';
import { Game, type GameOptions, type StarEvent } from './game';
import { RngSystem } from '../rng/rng.system';
import type { Input } from '../input/input';
import type { SerializedInput } from '../input/input-system';

export type ServerSessionOptions = BetterOmit<
  PartialBy<GameOptions, 'configOverrides'>,
  'id'
> & {
  id?: string;
};

export type SimulationResult = {
  damageTaken: Record<string, number>;
  healReceived: Record<string, number>;
  deaths: string[];
  newEntities: Array<{
    id: string;
    position: Point3D;
    spriteId: string;
  }>;
};

export class GameSession {
  readonly game: Game;

  private eventsSinceLastInput: StarEvent[] = [];

  constructor(options: ServerSessionOptions) {
    this.game = new Game({
      id: options.id ?? 'SERVER',
      rngSeed: options.rngSeed,
      mapId: options.mapId,
      configOverrides: options.configOverrides ?? {}
    });
  }

  initialize() {
    return this.game.initialize();
  }

  subscribe(cb: (input: SerializedInput, events: StarEvent[]) => void) {
    let latestInput: Nullable<Input<any>> = null;

    this.game.on('game.input-queue-flushed', () => {
      const lastInput = this.game.inputSystem.getHistory().at(-1)!;
      // update for  this input has already been pushed
      if (latestInput === lastInput) return;

      cb(lastInput.serialize() as SerializedInput, this.eventsSinceLastInput);
      latestInput = lastInput;
    });
  }

  dispatch(input: SerializedInput) {
    this.game.dispatch(input);
    this.eventsSinceLastInput = [];
  }
}
