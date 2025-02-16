import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from '@game/shared';
import { AlreadyPerformedManaActionError, NotActivePlayerError } from './input-errors';

const schema = defaultInputSchema.extend({
  index: z.number().nonnegative()
});

export class PutCardInManaZoneInput extends Input<typeof schema> {
  readonly name = 'putCardInManaZone';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get isActive() {
    return this.game.turnSystem.activePlayer.equals(this.player);
  }

  impl() {
    assert(this.isActive, new NotActivePlayerError());
    assert(
      !this.player.hasPlayedShardOrManaThisTurn,
      new AlreadyPerformedManaActionError()
    );

    this.player.putCardAtIndexInManaZone(this.payload.index);
  }
}
