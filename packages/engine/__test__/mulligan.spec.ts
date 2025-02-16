import { test, describe, expect } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS } from '../src/card/card.enums';
import { GAME_PHASES } from '../src/game/systems/game-phase.system';
import {
  AlreadyMulliganedError,
  TooManyMulliganedCardsError
} from '../src/input/inputs/mulligan.input';

describe('Mulligan', () => {
  const setupWithTestCardPoolAndDecks = () => {
    const cardPool = {
      'test-hero': makeTestHeroBlueprint({ id: 'test-hero', faction: FACTIONS.F1 }),
      'test-creature': makeTestCreatureBlueprint({
        id: 'test-creature',
        faction: FACTIONS.F1
      })
    };

    return testGameBuilder()
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
  };

  test('game starts once both players have mulliganed', () => {
    const { game, skipMulligan } = setupWithTestCardPoolAndDecks();
    skipMulligan();

    expect(game.gamePhaseSystem.phase).toBe(GAME_PHASES.BATTLE);
  });

  test('a player can only mulligan once', () => {
    const { game, player1, errors } = setupWithTestCardPoolAndDecks();

    game.dispatch({
      type: 'mulligan',
      payload: { indices: [], playerId: player1.id }
    });
    expect(player1.hasMulliganed).toBe(true);

    game.dispatch({
      type: 'mulligan',
      payload: { indices: [], playerId: player1.id }
    });
    expect(errors[0]).toBeInstanceOf(AlreadyMulliganedError);
  });

  test('a player can only mulligan up to 3 cards', () => {
    const { game, player1, errors } = setupWithTestCardPoolAndDecks();

    game.dispatch({
      type: 'mulligan',
      payload: { indices: [0, 1, 2, 3], playerId: player1.id }
    });
    expect(errors[0]).toBeInstanceOf(TooManyMulliganedCardsError);
  });
});
