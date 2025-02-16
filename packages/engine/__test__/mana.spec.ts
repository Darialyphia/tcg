import { test, describe, expect } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  makeTestShardBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS } from '../src/card/card.enums';
import { GAME_PHASES } from '../src/game/systems/game-phase.system';
import {
  AlreadyMulliganedError,
  TooManyMulliganedCardsError
} from '../src/input/inputs/mulligan.input';

const setupWithTestCardPoolAndDecks = () => {
  const cardPool = {
    'test-hero': makeTestHeroBlueprint({ id: 'test-hero', faction: FACTIONS.F1 }),
    'test-creature': makeTestCreatureBlueprint({
      id: 'test-creature',
      faction: FACTIONS.F1
    }),
    'test-shard': makeTestShardBlueprint({
      id: 'test-shard',
      faction: FACTIONS.F1
    })
  };

  const game = testGameBuilder()
    .withCardPool(cardPool)
    .withP1Deck({
      hero: { blueprintId: 'test-hero' },
      evolutions: [],
      cards: Array.from({ length: 30 }, () => ({ blueprintId: 'test-creature' }))
    })
    .withP2Deck({
      hero: { blueprintId: 'test-hero' },
      evolutions: [],
      cards: Array.from({ length: 30 }, () => ({ blueprintId: 'test-creature' }))
    })
    .build();
  game.skipMulligan();

  return game;
};

describe('Mana Zone', () => {
  test('a card put in mana zone is removed from hand', () => {
    const { game, player1 } = setupWithTestCardPoolAndDecks();
    const index = 0;
    const card = player1.getCardAt(index);
    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: index, playerId: player1.id }
    });

    expect(player1.hand).not.toContain(card);
  });
});
