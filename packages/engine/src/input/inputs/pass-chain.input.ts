import { assert } from '@game/shared';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { defaultInputSchema, Input } from '../input';

const schema = defaultInputSchema;

export class PassChainInput extends Input<typeof schema> {
  readonly name = 'passChain';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  impl() {
    assert(this.game.effectChainSystem.currentChain, 'There is no ongoing effect chain.');

    this.game.effectChainSystem.pass(this.player);
  }
}
