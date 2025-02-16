import { describe, expect, test, vi } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  makeTestSpellBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS, SPELL_KINDS } from '../src/card/card.enums';
import { NotEnoughManaError } from '../src/card/card-errors';

describe('Spell', () => {
  const setup = () => {
    const cardPool = {
      'test-hero': makeTestHeroBlueprint({ id: 'test-hero', faction: FACTIONS.F1 }),
      'test-creature': makeTestCreatureBlueprint({
        id: 'test-creature',
        faction: FACTIONS.F1
      }),
      'test-spell-cast': makeTestSpellBlueprint({
        id: 'test-spell-cast',
        faction: FACTIONS.F1,
        spellKind: SPELL_KINDS.CAST,
        followup: { targets: [], canCommit: () => true },
        onPlay: vi.fn()
      })
    } as const;

    const game = testGameBuilder()
      .withCardPool(cardPool)
      .withP1Deck({
        hero: { blueprintId: 'test-hero' },
        evolutions: [],
        cards: Array.from({ length: 30 }, () => ({ blueprintId: 'test-spell-cast' }))
      })
      .withP2Deck({
        hero: { blueprintId: 'test-hero' },
        evolutions: [],
        cards: Array.from({ length: 30 }, () => ({ blueprintId: 'test-spell-cast' }))
      })
      .build();

    game.skipMulligan();

    return { ...game, cardPool };
  };

  test("cannot play a spell if its player doesn't have enough mana", () => {
    const { game, player1, errors } = setup();
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });

    expect(errors[0]).toBeInstanceOf(NotEnoughManaError);
  });

  test('playing a spell starts an effect chain', () => {
    const { game, player1 } = setup();
    player1.gainMana(1);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });
    expect(game.effectChainSystem.currentChain).not.toBeNull();
  });

  // test("a spell doesn't play until the chain is resolved", () => {
  //   const { game, player1, player2, cardPool } = setup();
  //   player1.gainMana(1);
  //   game.dispatch({
  //     type: 'playCard',
  //     payload: { index: 0, playerId: player1.id }
  //   });

  //   const spy = cardPool['test-spell-cast'].onPlay;
  //   expect(spy).not.toHaveBeenCalled();
  //   game.effectChainSystem.pass(player2);
  //   game.effectChainSystem.pass(player1);

  //   expect(spy).toHaveBeenCalled();
  // });
});
