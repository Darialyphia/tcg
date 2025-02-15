import { assert } from '@game/shared';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';

const schema = defaultInputSchema;

export class DeclareEndTurnInput extends Input<typeof schema> {
  readonly name = 'declareEndTurn';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  impl() {
    assert(
      this.game.turnSystem.activePlayer.equals(this.player),
      'You are not the active player'
    );

    this.game.interaction.declareTurnEnd();
  }
}
