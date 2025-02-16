import { test, describe, expect } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS } from '../src/card/card.enums';
import {
  AllCreaturesSlotsOccupiedError,
  NotEnoughManaError
} from '../src/card/card-errors';
import { type CreatureSlot } from '../src/game/systems/game-board.system';
import { IllegalTargetError } from '../src/game/systems/interaction.system';
import type { CreatureBlueprint } from '../src/card/card-blueprint';

describe('Creature', () => {
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

  test("cannot play a creature if its player doesn't have enough mana", () => {
    const { game, player1, errors } = setup();
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });

    expect(errors[0]).toBeInstanceOf(NotEnoughManaError);
  });

  test('a creature is not played until its location has been defined', () => {
    const { game, player1 } = setup();
    player1.gainMana(1);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });
    expect(player1.boardSide.getAllCreatures().length).toBe(0);
  });

  test('can play a creature to the attack zone', () => {
    const { game, player1 } = setup();
    player1.gainMana(1);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });
    game.dispatch({
      type: 'addCardTarget',
      payload: {
        target: { type: 'creatureSlot', zone: 'attack', slot: 0 },
        playerId: player1.id
      }
    });
    expect(player1.boardSide.getCreatureAt('attack', 0)).toBeDefined();
  });

  test('can play a creature to the defense zone', () => {
    const { game, player1 } = setup();
    player1.gainMana(1);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });
    game.dispatch({
      type: 'addCardTarget',
      payload: {
        target: { type: 'creatureSlot', zone: 'defense', slot: 0 },
        playerId: player1.id
      }
    });
    expect(player1.boardSide.getCreatureAt('defense', 0)).toBeDefined();
  });

  test('cannot play a creature on an occupied slot', () => {
    const { game, player1, errors } = setup();
    player1.gainMana(2);
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });
    game.dispatch({
      type: 'addCardTarget',
      payload: {
        target: { type: 'creatureSlot', zone: 'attack', slot: 0 },
        playerId: player1.id
      }
    });
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });
    game.dispatch({
      type: 'addCardTarget',
      payload: {
        target: { type: 'creatureSlot', zone: 'attack', slot: 0 },
        playerId: player1.id
      }
    });

    expect(errors[0]).toBeInstanceOf(IllegalTargetError);
  });

  test('cannot play a creature if all slots are occupied', () => {
    const { game, player1, errors } = setup();
    player1.gainMana(10);
    for (let i = 0; i < 5; i++) {
      const attacker = player1.generateCard<CreatureBlueprint>('test-creature');
      const defender = player1.generateCard<CreatureBlueprint>('test-creature');
      player1.boardSide.summonCreature(attacker, 'attack', i as CreatureSlot);
      player1.boardSide.summonCreature(defender, 'defense', i as CreatureSlot);
    }
    game.dispatch({
      type: 'playCard',
      payload: { index: 0, playerId: player1.id }
    });

    expect(errors[0]).toBeInstanceOf(AllCreaturesSlotsOccupiedError);
  });
});
