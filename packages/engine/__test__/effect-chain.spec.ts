import { describe, expect, test, vi } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  makeTestSpellBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS, SPELL_KINDS } from '../src/card/card.enums';
import type { CreatureBlueprint, SpellBlueprint } from '../src/card/card-blueprint';
import { IllegalPlayerResponseError } from '../src/game/effect-chain';
import { IllegalSpellTypePlayedError } from '../src/card/card-errors';

describe('Effect Chain', () => {
  const setup = () => {
    const cardPool = {
      'test-hero': makeTestHeroBlueprint({ id: 'test-hero', faction: FACTIONS.F1 }),
      'test-creature': makeTestCreatureBlueprint({
        id: 'test-creature',
        faction: FACTIONS.F1,
        abilities: [
          {
            manaCost: 0,
            followup: {
              targets: [
                {
                  type: 'card',
                  isElligible: () => true
                }
              ],
              canCommit: () => true
            },
            onResolve: vi.fn()
          }
        ]
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

    game.helpers.skipMulligan();

    return { ...game, cardPool };
  };

  test('Passing without an initial response instantly resolves the chain', () => {
    const { game, player1, player2, cardPool } = setup();

    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );

    game.effectChainSystem.pass(player2);
    expect(game.effectChainSystem.currentChain).not.toBeTruthy();
  });

  test('A player cannot pass when it is not their turn', () => {
    const { game, player1, cardPool } = setup();

    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );
    expect(() => game.effectChainSystem.pass(player1)).toThrowError(
      IllegalPlayerResponseError
    );
  });

  test('A player can respond to a chain with a spell only if it is a burst spell', () => {
    const { game, player1, player2, cardPool } = setup();

    player1.gainMana(2);
    player2.gainMana(1);

    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );

    player2.playCard(
      player2.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );

    expect(game.effectChainSystem.currentChain!.size).toBe(2);

    expect(() =>
      player2.playCard(
        player2.generateCard<SpellBlueprint>(cardPool['test-spell-cast'].id)
      )
    ).toThrowError(IllegalSpellTypePlayedError);
  });

  test('A player can respond to a chain with an ability', () => {
    const { game, player1, player2, cardPool } = setup();

    player2.gainMana(10);
    player2.playCard(
      player2.generateCard<CreatureBlueprint>(cardPool['test-creature'].id)
    );
    game.interaction.addCardTarget({
      type: 'creatureSlot',
      slot: 0,
      zone: 'attack',
      player: player2
    });
    const creature = player2.boardSide.getCreatureAt('attack', 0)!;
    creature.ready();

    player1.gainMana(10);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );

    creature.addAbilityToChain(0);
    game.interaction.addCardTarget({ type: 'card', card: creature });

    expect(game.effectChainSystem.currentChain!.size).toBe(2);
  });

  test('A chain resolves when both player pass in a row', () => {
    const { game, player1, player2, cardPool } = setup();

    player1.gainMana(1);
    player1.playCard(
      player1.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );

    player2.gainMana(1);
    player2.playCard(
      player2.generateCard<SpellBlueprint>(cardPool['test-spell-burst'].id)
    );

    game.effectChainSystem.pass(player1);
    game.effectChainSystem.pass(player2);

    expect(game.effectChainSystem.currentChain).not.toBeTruthy();
  });
});
