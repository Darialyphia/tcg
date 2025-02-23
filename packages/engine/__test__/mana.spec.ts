import { test, describe, expect } from 'vitest';
import {
  makeTestCreatureBlueprint,
  makeTestHeroBlueprint,
  makeTestShardBlueprint,
  testGameBuilder
} from './test-utils';
import { FACTIONS } from '../src/card/card.enums';
import { AlreadyPerformedManaActionError } from '../src/input/inputs/input-errors';
import type { ShardBlueprint } from '../src/card/card-blueprint';
import { ShardZoneAlreadyOccupiedError } from '../src/game/systems/game-board.system';

const setup = () => {
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
  game.helpers.skipMulligan();

  return game;
};

describe('Mana Zone', () => {
  test('a card put in mana zone is removed from hand', () => {
    const { game, player1 } = setup();
    const index = 0;
    const card = player1.getCardAt(index);
    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: index, playerId: player1.id }
    });

    expect(player1.hand).not.toContain(card);
  });

  test('a card put in mana zone immediately gives mana', () => {
    const { game, player1 } = setup();
    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: 0, playerId: player1.id }
    });

    expect(player1.mana).toBe(1);
  });

  test('a player can only put a card in mana zone once per turn', () => {
    const { game, player1, errors } = setup();
    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: 0, playerId: player1.id }
    });
    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: 0, playerId: player1.id }
    });

    expect(errors[0]).toBeInstanceOf(AlreadyPerformedManaActionError);
  });

  test('a player cannot put a card in mana zone if they already put a card in shard zone', () => {
    const { game, player1, errors } = setup();
    const card = player1.generateCard<ShardBlueprint>('test-shard');
    player1.addToHand(card);

    const index = player1.hand.indexOf(card);

    game.dispatch({
      type: 'playCard',
      payload: { index, playerId: player1.id }
    });

    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: index, playerId: player1.id }
    });

    expect(errors[0]).toBeInstanceOf(AlreadyPerformedManaActionError);
  });
});

describe('Shard Zone', () => {
  test('a card put in shard zone is removed from hand', () => {
    const { game, player1 } = setup();
    const card = player1.generateCard<ShardBlueprint>('test-shard');
    player1.addToHand(card);

    game.dispatch({
      type: 'playCard',
      payload: { index: player1.hand.indexOf(card), playerId: player1.id }
    });

    expect(player1.hand).not.toContain(card);
  });

  test('cannot put a card in shard zone if there already is one', () => {
    const { game, player1, errors } = setup();

    const firstShard = player1.generateCard<ShardBlueprint>('test-shard');
    player1.boardSide.placeShard(firstShard);

    const secondShard = player1.generateCard<ShardBlueprint>('test-shard');
    player1.addToHand(secondShard);

    game.dispatch({
      type: 'playCard',
      payload: { index: player1.hand.indexOf(secondShard), playerId: player1.id }
    });
    expect(errors[0]).toBeInstanceOf(ShardZoneAlreadyOccupiedError);
  });

  test('cannot put a card in shard one if a card has already been put in mana zone', () => {
    const { game, player1, errors } = setup();

    game.dispatch({
      type: 'putCardInManaZone',
      payload: { index: 0, playerId: player1.id }
    });

    const card = player1.generateCard<ShardBlueprint>('test-shard');
    player1.addToHand(card);

    game.dispatch({
      type: 'playCard',
      payload: { index: player1.hand.indexOf(card), playerId: player1.id }
    });

    expect(errors[0]).toBeInstanceOf(AlreadyPerformedManaActionError);
  });

  test('shard zone is correctly emptied at the start of turn', () => {
    const { player1, player2 } = setup();
    const shard = player1.generateCard<ShardBlueprint>('test-shard');
    player1.boardSide.placeShard(shard);
    player1.endTurn();
    player2.endTurn();
    expect(player1.boardSide.isShardZoneOccupied).toBe(false);
  });

  test('shards are properly converted to mana at the start of turn', () => {
    const { player1, player2 } = setup();
    const shard = player1.generateCard<ShardBlueprint>('test-shard');
    player1.boardSide.placeShard(shard);
    expect(player1.mana).toBe(0);

    player1.endTurn();
    player2.endTurn();
    expect(player1.mana).toBe(1);
  });
});
