import { assert } from '@game/shared';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { defaultInputSchema, Input } from '../input';
import { z } from 'zod';

const schema = defaultInputSchema.extend({
  indices: z.number().array()
});

export class AlreadyMulliganedError extends Error {
  constructor() {
    super('Player has already mulliganed');
  }
}

export class TooManyMulliganedCardsError extends Error {
  constructor() {
    super('Too many cards mulliganed');
  }
}

export class MulliganInput extends Input<typeof schema> {
  readonly name = 'mulligan';

  readonly allowedPhases = [GAME_PHASES.MULLIGAN];

  protected payloadSchema = schema;

  impl() {
    assert(!this.player.hasMulliganed, new AlreadyMulliganedError());
    assert(
      this.payload.indices.length <= this.game.config.MAX_MULLIGANED_CARDS,
      new TooManyMulliganedCardsError()
    );

    this.player.commitMulliganIndices(this.payload.indices);

    if (this.game.playerSystem.players.every(p => p.hasMulliganed)) {
      this.game.gamePhaseSystem.startBattle();
    }
  }
}
