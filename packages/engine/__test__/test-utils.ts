import { Game, type GameOptions } from '../src/game/game';
import type { PlayerOptions } from '../src/player/player.entity';

export const testGameBuilder = () => {
  const options: Partial<GameOptions> = {};

  return {
    withMapId(id: string) {
      options.mapId = id;
      return this;
    },
    withSeed(seed: string) {
      options.rngSeed = seed;
      return this;
    },
    withP1Deck(deck: PlayerOptions['deck']) {
      // @ts-expect-error
      options.players ??= [];
      // @ts-expect-error
      options.players[0] = {
        deck,
        id: '',
        name: ''
      };
      return this;
    },
    withP2Deck(deck: PlayerOptions['deck']) {
      // @ts-expect-error
      options.players ??= [];
      // @ts-expect-error
      options.players[1] = {
        deck,
        id: '',
        name: ''
      };
      return this;
    },
    build() {
      const game = new Game({
        id: 'test',
        configOverrides: {},
        mapId: options.mapId ?? '1v1',
        rngSeed: options.rngSeed ?? 'test'
      });

      game.initialize();

      return {
        game
        // player1: game.playerSystem.player1,
        // player2: game.playerSystem.player2
      };
    }
  };
};
