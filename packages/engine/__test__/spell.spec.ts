import { describe, expect, test, vi } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  makeTestSpellBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS, SPELL_KINDS } from '../src/card/card.enums';
import { NotEnoughManaError } from '../src/card/card-errors';
import type { SpellBlueprint } from '../src/card/card-blueprint';

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
      }),
      'test-spell-burst': makeTestSpellBlueprint({
        id: 'test-spell-burst',
        faction: FACTIONS.F1,
        spellKind: SPELL_KINDS.BURST,
        followup: { targets: [], canCommit: () => true },
        onPlay: vi.fn()
      }),
      'test-spell-hero-enchant': makeTestSpellBlueprint({
        id: 'test-spell-hero-enchant',
        faction: FACTIONS.F1,
        spellKind: SPELL_KINDS.HERO_ENCHANT,
        followup: { targets: [], canCommit: () => true },
        onPlay: vi.fn()
      }),
      'test-spell-row-enchant': makeTestSpellBlueprint({
        id: 'test-spell-row-enchant',
        faction: FACTIONS.F1,
        spellKind: SPELL_KINDS.ROW_ENCHANT,
        followup: {
          targets: [
            {
              type: 'row',
              isElligible: () => true
            }
          ],
          canCommit: () => true
        },
        onPlay: vi.fn()
      }),
      'test-spell-column-enchant': makeTestSpellBlueprint({
        id: 'test-spell-column-enchant',
        faction: FACTIONS.F1,
        spellKind: SPELL_KINDS.COLUMN_ENCHANT,
        followup: {
          targets: [
            {
              type: 'column',
              isElligible: () => true
            }
          ],
          canCommit: () => true
        },
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

  test("a spell doesn't play until the chain is resolved", () => {
    const { game, player1, player2, cardPool } = setup();
    player1.gainMana(1);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });

    const spy = cardPool['test-spell-cast'].onPlay;
    expect(spy).not.toHaveBeenCalled();
    game.effectChainSystem.pass(player2);
    game.effectChainSystem.pass(player1);

    expect(spy).toHaveBeenCalled();
  });

  test('a cast spell is sent directly to the discard pile', () => {
    const { game, player1, player2 } = setup();
    player1.gainMana(1);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });

    game.effectChainSystem.pass(player2);
    game.effectChainSystem.pass(player1);

    expect(player1.discardPile.size).toBe(1);
  });

  test('a burst spell is sent directly to the discard pile', () => {
    const { game, player1, player2, cardPool } = setup();
    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );
    game.effectChainSystem.pass(player2);
    game.effectChainSystem.pass(player1);

    expect(player1.discardPile.size).toBe(1);
  });

  test('a row enchant spell is placed in the correct row enchant zone', () => {
    const { game, player1, player2, cardPool } = setup();
    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-row-enchant'].id)
    );
    game.interaction.addCardTarget({
      type: 'row',
      zone: 'attack',
      player: player1
    });
    game.effectChainSystem.pass(player2);
    game.effectChainSystem.pass(player1);

    expect(player1.boardSide.attackZone.enchants.length).toBe(1);
  });

  test('a hero enchant spell is placed on the hero zone', () => {
    const { game, player1, player2, cardPool } = setup();
    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-hero-enchant'].id)
    );
    game.effectChainSystem.pass(player2);
    game.effectChainSystem.pass(player1);

    expect(player1.boardSide.heroEnchants.length).toBe(1);
  });

  test('a column enchant spell is placed in the correct column enchant zone', () => {
    const { game, player1, player2, cardPool } = setup();
    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-column-enchant'].id)
    );
    game.interaction.addCardTarget({
      type: 'column',
      slot: 0
    });
    game.effectChainSystem.pass(player2);
    game.effectChainSystem.pass(player1);

    expect(game.board.columnEnchants[0].length).toBe(1);
  });
});
