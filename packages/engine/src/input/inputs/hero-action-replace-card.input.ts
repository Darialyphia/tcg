import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';

const schema = defaultInputSchema.extend({
  index: z.number().nonnegative()
});

export class HeroActionReplaceCardInput extends Input<typeof schema> {
  readonly name = 'heroActionReplaceCard';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  impl() {
    if (!this.game.turnSystem.activePlayer.equals(this.player)) {
      throw new Error('You are not the active player.');
    }

    this.player.hero.replace(this.payload.index);
  }
}
