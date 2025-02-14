import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from 'vitest';

const schema = defaultInputSchema;

export class SkipAttackResponseInput extends Input<typeof schema> {
  readonly name = 'skipAttackResponse';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get isActive() {
    return this.game.turnSystem.activePlayer.equals(this.player);
  }

  impl() {
    assert(!this.isActive, 'Cannot skip attack response as the active player.');
    this.game.interaction.skipAttackResponse(this.player);
  }
}
