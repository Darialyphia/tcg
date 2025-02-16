import { z } from 'zod';
import { defaultInputSchema, Input } from '../input';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { assert } from '@game/shared';
import { Spell } from '../../card/entities/spell.entity';
import { SPELL_KINDS } from '../../card/card.enums';
import { AlreadyPerformedManaActionError } from './input-utils';
import { Shard } from '../../card/entities/shard.entity';

const schema = defaultInputSchema.extend({
  index: z.number()
});

export class PlayCardInput extends Input<typeof schema> {
  readonly name = 'playCard';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get card() {
    return this.player.getCardAt(this.payload.index);
  }

  get isActive() {
    return this.game.turnSystem.activePlayer.equals(this.player);
  }

  handleSpell(card: Spell) {
    if (!this.isActive) {
      assert(
        this.game.effectChainSystem.currentChain,
        "Cannot play spell without an effect chain dring the opponent's turn."
      );
      assert(
        card.spellKind === SPELL_KINDS.BURST,
        'Cannot play non-burst spell during opponent turn.'
      );
    }
    this.player.playCardAtIndex(this.payload.index);
  }

  handleShard() {
    assert(
      !this.player.hasPlayedShardOrManaThisTurn,
      new AlreadyPerformedManaActionError()
    );
    this.player.playCardAtIndex(this.payload.index);
  }

  impl() {
    const card = this.card;
    assert(card, 'Card not found.');
    if (card instanceof Spell) {
      this.handleSpell(card);
    } else if (card instanceof Shard) {
      this.handleShard();
    } else {
      assert(this.isActive, 'You are not the active player.');
      this.player.playCardAtIndex(this.payload.index);
    }
  }
}
