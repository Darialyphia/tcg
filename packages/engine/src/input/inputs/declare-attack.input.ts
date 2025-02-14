import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from '@game/shared';

const schema = defaultInputSchema.extend({
  attackerId: z.string(),
  defenderId: z.string()
});

export class DeclareAttackInput extends Input<typeof schema> {
  readonly name = 'declareAttack';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get attacker() {
    const candidates = this.player.boardSide.getCreatures('attack');

    return candidates.find(creature => creature.id === this.payload.attackerId);
  }

  get defender() {
    const candidates = [
      this.player.opponent.hero,
      ...this.player.opponent.boardSide.getCreatures('attack'),
      ...this.player.opponent.boardSide.getCreatures('defense')
    ];

    return candidates.find(creature => creature.id === this.payload.defenderId);
  }

  impl() {
    assert(
      this.game.turnSystem.activePlayer.equals(this.player),
      'You are not the active player.'
    );
    assert(this.attacker, 'Attacker not found.');
    assert(this.defender, 'Defender not found.');
    assert(this.attacker.canAttack, 'Attacker cannot attack.');
    assert(this.defender.canBeAttackTarget, 'Defender cannot be attacked.');

    this.game.interaction.declareAttack(this.attacker, this.defender);
  }
}
