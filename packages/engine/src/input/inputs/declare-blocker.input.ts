import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from '@game/shared';
import { INTERACTION_STATES } from '../../game/systems/interaction.system';

const schema = defaultInputSchema.extend({
  blockerId: z.string()
});

export class DeclareBlockerInput extends Input<typeof schema> {
  readonly name = 'declareBlocker';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get blocker() {
    const candidates = this.player.opponent.boardSide.getCreatures('defense');

    return candidates.find(creature => creature.id === this.payload.blockerId);
  }

  impl() {
    assert(
      !this.game.turnSystem.activePlayer.equals(this.player),
      'Attacker cannot block.'
    );

    assert(
      this.game.interaction.context.state === INTERACTION_STATES.RESPOND_TO_ATTACK,
      'Invalid interaction state.'
    );

    assert(!this.game.interaction.context.ctx.blocker, 'Blocker already declared.');
    const { attacker } = this.game.interaction.context.ctx;

    assert(this.blocker, 'Blocker not found.');
    assert(attacker.canBeBlocked(this.blocker), 'Blocker cannot block attacker.');
    assert(this.blocker.canBlock(attacker), 'Blocker cannot block attacker.');
    assert(
      !this.game.effectChainSystem.currentChain,
      'Cannot block during effect chain.'
    );

    this.game.interaction.declareBlocker(this.blocker);
  }
}
