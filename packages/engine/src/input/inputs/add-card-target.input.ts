import { assert } from '@game/shared';
import { GAME_PHASES } from '../../game/systems/game-phase.system';
import { defaultInputSchema, Input } from '../input';
import { z, ZodType } from 'zod';
import { match } from 'ts-pattern';

function numericEnum<TValues extends readonly number[]>(values: TValues) {
  return z.number().superRefine((val, ctx) => {
    if (!values.includes(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_enum_value,
        options: [...values],
        received: val
      });
    }
  }) as ZodType<TValues[number]>;
}

const schema = defaultInputSchema.extend({
  target: z
    .object({
      type: z.literal('card'),
      cardId: z.string()
    })
    .or(
      z.object({
        type: z.literal('creatureSlot'),
        zone: z.enum(['attack', 'defense']),
        slot: numericEnum([0, 1, 2, 3, 4] as const)
      })
    )
});

export class AddCardTargetInput extends Input<typeof schema> {
  readonly name = 'addCardTarget';

  readonly allowedPhases = [GAME_PHASES.BATTLE];

  protected payloadSchema = schema;

  get card() {
    assert(this.payload.target.type === 'card', 'Target is not a card.');
    const allCardsInPlay = this.game.playerSystem.players.flatMap(p =>
      p.boardSide.getAllCardsInPlay()
    );

    const { cardId } = this.payload.target;
    return allCardsInPlay.find(c => c.id === cardId);
  }

  impl() {
    if (!this.game.turnSystem.activePlayer.equals(this.player)) {
      throw new Error('You are not the active player.');
    }

    match(this.payload.target)
      .with({ type: 'card' }, () => {
        this.game.interaction.addCardTarget({
          type: 'card',
          card: this.card!
        });
      })
      .with({ type: 'creatureSlot' }, ({ zone, slot }) => {
        this.game.interaction.addCardTarget({
          type: 'creatureSlot',
          zone,
          slot
        });
      })
      .exhaustive();
  }
}
