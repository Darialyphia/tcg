import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from 'vitest';
import { isDefined } from '@game/shared';

const schema = defaultInputSchema.extend({
  index: z.number()
});

export class HeroActionUseAbilityCardInput extends Input<typeof schema> {
  readonly name = 'heroActionUseAbility';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get hasChain() {
    return isDefined(this.game.effectChainSystem.currentChain);
  }

  get isActive() {
    return this.game.turnSystem.activePlayer.equals(this.player);
  }

  impl() {
    assert(
      this.isActive || this.hasChain,
      "Cannot use ability without an effect chain during opponent's turn."
    );

    if (this.hasChain) {
      this.player.hero.addAbilityToChain(this.payload.index);
    } else {
      this.player.hero.declareAbility(this.payload.index);
    }
  }
}
