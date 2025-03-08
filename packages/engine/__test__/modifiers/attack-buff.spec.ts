import { test, describe, expect } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  testGameBuilder
} from '../test-utils';
import { FACTIONS } from '../../src/card/card.enums';
import { AttackBuffModifier } from '../../src/card/modifiers/attack-buff.modifier';
import type { Creature } from '../../src/card/entities/creature.entity';

describe('AttackerBuffModifier', () => {
  const setup = () => {
    const cardPool = {
      'test-hero': makeTestHeroBlueprint({ id: 'test-hero', faction: FACTIONS.F1 }),
      'test-creature': makeTestCreatureBlueprint({
        id: 'test-creature',
        faction: FACTIONS.F1
      })
    };

    const game = testGameBuilder()
      .withCardPool(cardPool)
      .withP1Deck({
        hero: { blueprintId: 'test-hero' },
        cards: Array.from({ length: 30 }, () => ({ blueprintId: 'test-creature' }))
      })
      .withP2Deck({
        hero: { blueprintId: 'test-hero' },
        cards: Array.from({ length: 30 }, () => ({ blueprintId: 'test-creature' }))
      })
      .build();

    game.helpers.skipMulligan();

    return { ...game, cardPool };
  };

  test("Should buff the attack of the creature it's attached to", () => {
    const { player1, game, helpers, cardPool } = setup();

    const creature = helpers.summonCreatureAndReady(player1, {
      blueprint: cardPool['test-creature'],
      slot: 0,
      zone: 'attack'
    });

    creature.addModifier(
      new AttackBuffModifier<Creature>('test-attacker-buff', game, creature, 1)
    );

    expect(creature.atk).toBe(2);
  });

  test('Should have scaling attack increase with stacks', () => {
    const { player1, game, helpers, cardPool } = setup();

    const creature = helpers.summonCreatureAndReady(player1, {
      blueprint: cardPool['test-creature'],
      slot: 0,
      zone: 'attack'
    });

    creature.addModifier(
      new AttackBuffModifier<Creature>('test-attacker-buff', game, creature, 2)
    );

    expect(creature.atk).toBe(3);
  });
});
