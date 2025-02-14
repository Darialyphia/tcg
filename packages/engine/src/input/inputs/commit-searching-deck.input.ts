import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { defaultInputSchema, Input } from '../input';
import { z } from 'zod';

const schema = defaultInputSchema.extend({
  ids: z.array(z.string())
});

export class CommitSearchingDeckCardInput extends Input<typeof schema> {
  readonly name = 'commitSearchingDeck';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  impl() {
    this.game.interaction.commitSearchingDeck(this.payload.ids);
  }
}
