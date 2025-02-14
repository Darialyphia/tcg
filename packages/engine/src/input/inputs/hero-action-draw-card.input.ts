import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';

const schema = defaultInputSchema;

export class HeroActionDrawCardInput extends Input<typeof schema> {
  readonly name = 'heroActionDrawCard';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  impl() {
    if (!this.game.turnSystem.activePlayer.equals(this.player)) {
      throw new Error('You are not the active player.');
    }

    this.player.hero.drawCard();
  }
}
