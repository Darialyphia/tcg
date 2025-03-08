import { test, describe, expect } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  testGameBuilder
} from '../test-utils';
import { FACTIONS } from '../../src/card/card.enums';
import type { Creature } from '../../src/card/entities/creature.entity';
import { AttackerModifier } from '../../src/card/modifiers/attacker.modifier';
import { AttackBuffModifier } from '../../src/card/modifiers/attack-buff.modifier';

describe('AttackerBuffModifier', () => {
  const setup = () => {
    const cardPool = {
      'test-hero': makeTestHeroBlueprint({ id: 'test-hero', faction: FACTIONS.F1 }),
      'test-creature': makeTestCreatureBlueprint({
        id: 'test-creature',
        faction: FACTIONS.F1,
        onPlay(game, card) {
          card.addModifier(new AttackerModifier<Creature>(game, card, 1));
        }
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

  test('Should buff the attack if the card is played in the attack zone', () => {
    const { player1, helpers, cardPool } = setup();

    const creature = helpers.summonCreatureAndReady(player1, {
      blueprint: cardPool['test-creature'],
      slot: 0,
      zone: 'attack'
    });

    expect(creature.hasModifier(AttackBuffModifier)).toBe(true);
  });

  test('Should not buff the attack if the card is played in the defense zone', () => {
    const { player1, helpers, cardPool } = setup();

    const creature = helpers.summonCreatureAndReady(player1, {
      blueprint: cardPool['test-creature'],
      slot: 0,
      zone: 'defense'
    });

    expect(creature.hasModifier(AttackBuffModifier)).toBe(false);
  });
});
