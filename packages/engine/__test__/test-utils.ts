import { assert, isDefined } from '@game/shared';
import { Game, type GameOptions, type GamePlayer } from '../src/game/game';
import type {
  CreatureBlueprint,
  HeroBlueprint,
  ShardBlueprint,
  SpellBlueprint
} from '../src/card/card-blueprint';
import {
  CARD_KINDS,
  CARD_SETS,
  CREATURE_JOB,
  RARITIES,
  type SpellKind
} from '../src/card/card.enums';
import type { Faction } from '../src/card/entities/faction.entity';
import { GAME_EVENTS } from '../src/game/game.events';

export const testGameBuilder = () => {
  const options: Partial<GameOptions> = {};

  return {
    withSeed(seed: string) {
      options.rngSeed = seed;
      return this;
    },
    withCardPool(pool: GameOptions['cardPool']) {
      options.cardPool = pool;
      return this;
    },
    withP1Deck(deck: GamePlayer['deck']) {
      // @ts-expect-error
      options.players ??= [];
      // @ts-expect-error
      options.players[0] = {
        deck,
        id: 'p1',
        name: 'player1'
      };
      return this;
    },
    withP2Deck(deck: GamePlayer['deck']) {
      // @ts-expect-error
      options.players ??= [];
      // @ts-expect-error
      options.players[1] = {
        deck,
        id: 'p2',
        name: 'player2'
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

      const errors: Error[] = [];

      game.on(GAME_EVENTS.ERROR, event => {
        errors.push(event.data.error);
      });

      return {
        game,
        skipMulligan: () => {
          game.dispatch({
            type: 'mulligan',
            payload: { indices: [], playerId: game.playerSystem.player1.id }
          });
          game.dispatch({
            type: 'mulligan',
            payload: { indices: [], playerId: game.playerSystem.player2.id }
          });
        },
        errors,
        player1: game.playerSystem.player1,
        player2: game.playerSystem.player2
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

export const makeTestShardBlueprint = ({
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

export const makeTestCreatureBlueprint = ({
  id,
  faction,
  atk = 1,
  manaCost = 1,
  maxHp = 1,
  job = CREATURE_JOB.STRIKER,
  onPlay = () => {},
  onInit = () => {}
}: {
  id: string;
  faction: Faction;
  maxHp?: number;
  atk?: number;
  manaCost?: number;
  job?: string;
  onPlay?: CreatureBlueprint['onPlay'];
  onInit?: CreatureBlueprint['onPlay'];
}): CreatureBlueprint => ({
  id,
  faction,
  atk,
  maxHp,
  manaCost,
  job,
  onPlay,
  onInit,
  abilities: [],
  keywords: [],
  name: 'Test Creature',
  kind: CARD_KINDS.CREATURE,
  description: 'Test Creature Description',
  imageId: '',
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  loyalty: 0
});

export const makeTestSpellBlueprint = ({
  id,
  faction,
  manaCost = 1,
  spellKind,
  followup,
  onPlay = () => {},
  onInit = () => {}
}: {
  id: string;
  spellKind: SpellKind;
  followup: SpellBlueprint['followup'];
  faction: Faction;
  manaCost?: number;
  onPlay?: SpellBlueprint['onPlay'];
  onInit?: SpellBlueprint['onInit'];
}): SpellBlueprint => ({
  id,
  faction,
  manaCost,
  spellKind,
  followup,
  onInit,
  onPlay,
  name: 'Test Spell',
  kind: CARD_KINDS.SPELL,
  description: 'Test Spell Description',
  imageId: '',
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  loyalty: 0
});
