import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from '@game/shared';
import { Spell } from '../../card/entities/spell.entity';
import { SPELL_KINDS } from '../../card/card.enums';
import { AlreadyPerformedManaActionError, NotActivePlayerError } from './input-utils';

const schema = defaultInputSchema.extend({
  index: z.number()
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
