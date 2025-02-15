import { assert, isDefined } from '@game/shared';
import { Game, type GameOptions, type GamePlayer } from '../src/game/game';
import type { HeroBlueprint, ShardBlueprint } from '../src/card/card-blueprint';
import { CARD_KINDS, CARD_SETS, FACTIONS, RARITIES } from '../src/card/card.enums';
import type { Faction } from '../src/card/entities/faction.entity';

export const testGameBuilder = () => {
  const options: Partial<GameOptions> = {};

  return {
    withSeed(seed: string) {
      options.rngSeed = seed;
      return this;
    },
    withP1Deck(deck: GamePlayer['deck']) {
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
    withP2Deck(deck: GamePlayer['deck']) {
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
      const { players, cardPool } = options;
      assert(isDefined(cardPool), 'cardPool must be defined');
      assert(isDefined(players), 'players must be defined');
      assert(players.length === 2, 'players must have 2 entries');
      const game = new Game({
        id: 'test',
        configOverrides: {},
        rngSeed: options.rngSeed ?? 'test',
        players,
        cardPool
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

export const makeTestHeroBlueprint = ({
  id,
  faction,
  maxHp = 18
}: {
  id: string;
  faction: Faction;
  maxHp?: number;
}): HeroBlueprint => ({
  id,
  faction,
  name: 'Test Hero',
  kind: CARD_KINDS.HERO,
  description: 'Test Hero Description',
  imageId: '',
  maxHp,
  abilities: [],
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE
});

export const makeTestShard = ({
  id,
  faction
}: {
  id: string;
  faction: Faction;
}): ShardBlueprint => ({
  id,
  faction,
  name: 'Test Hero',
  kind: CARD_KINDS.SHARD,
  description: 'Test Hero Description',
  imageId: '',
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  loyalty: 0,
  onInit() {},
  onPlay() {}
});
