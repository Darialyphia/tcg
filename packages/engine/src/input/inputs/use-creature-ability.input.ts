import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert, isDefined } from '@game/shared';
import { CardNotFoundError } from '../../card/card-errors';

const schema = defaultInputSchema.extend({
  cardId: z.string(),
  index: z.number().nonnegative()
});

export class UseCreatureAbilityInput extends Input<typeof schema> {
  readonly name = 'useCreatureAbility';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get hasChain() {
    return isDefined(this.game.effectChainSystem.currentChain);
  }

  get isActive() {
    return this.game.turnSystem.activePlayer.equals(this.player);
  }

  get card() {
    const candidates = [
      ...this.player.boardSide.getCreatures('attack'),
      ...this.player.boardSide.getCreatures('defense')
    ];

    return candidates.find(creature => creature.id === this.payload.cardId);
  }

  impl() {
    assert(
      this.isActive || this.hasChain,
      "Cannot use ability without an effect chain during opponent's turn."
    );
    assert(this.card, new CardNotFoundError());
    assert(this.card.canUseAbility, 'Card cannot use ability.');

    if (this.hasChain) {
      this.card.addAbilityToChain(this.payload.index);
    } else {
      this.card.declareAbility(this.payload.index);
    }
  }
}
