import { type BetterOmit, type PartialBy } from '@game/shared';
import { Game, type GameOptions } from './game';
import type { SerializedInput } from '../input/input-system';
import type { GameStateSnapshot } from './game-snapshot.system';
import { GAME_EVENTS } from './game.events';

export type GameSessionOptions = BetterOmit<
  PartialBy<GameOptions, 'configOverrides'>,
  'id'
> & {
  id?: string;
};

export class GameSession {
  readonly game: Game;

  constructor(options: GameSessionOptions) {
    this.game = new Game({
      id: options.id ?? 'GAME_SESSION',
      rngSeed: options.rngSeed,
      mapId: options.mapId,
      configOverrides: options.configOverrides ?? {}
    });
  }

  initialize() {
    return this.game.initialize();
  }

  subscribe(cb: (snapshot: GameStateSnapshot) => void) {
    this.game.on(GAME_EVENTS.FLUSHED, () => {
      cb(this.game.serializer.getLatestSnapshot());
    });
  }

  dispatch(input: SerializedInput) {
    this.game.dispatch(input);
  }
}
