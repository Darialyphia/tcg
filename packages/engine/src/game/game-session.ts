import { type BetterOmit, type PartialBy } from '@game/shared';
import { Game, type GameOptions } from './game';
import type { SerializedInput } from '../input/input-system';
import type { GameStateSnapshot } from './systems/game-snapshot.system';
import { GAME_EVENTS } from './game.events';

export type GameSessionOptions = BetterOmit<
  PartialBy<GameOptions, 'configOverrides'>,
  'id'
> & {
  id?: string;
};

export class GameSession {
  private readonly game: Game;

  constructor(options: GameSessionOptions) {
    this.game = new Game({
      id: options.id ?? 'GAME_SESSION',
      rngSeed: options.rngSeed,
      configOverrides: options.configOverrides ?? {},
      players: options.players,
      cardPool: options.cardPool
    });
  }

  initialize() {
    return this.game.initialize();
  }

  subscribe(playerId: string | null, cb: (snapshot: GameStateSnapshot) => void) {
    this.game.on(GAME_EVENTS.FLUSHED, () => {
      if (playerId) {
        cb(this.game.serializer.getLatestSnapshotForPlayer(playerId));
      } else {
        cb(this.game.serializer.getLatestOmniscientSnapshot());
      }
    });
  }

  dispatch(input: SerializedInput) {
    this.game.dispatch(input);
  }
}
