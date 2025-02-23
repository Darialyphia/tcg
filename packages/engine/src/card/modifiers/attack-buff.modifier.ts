import type { Game } from '../../game/game';
import type { Creature } from '../entities/creature.entity';
import type { Evolution } from '../entities/evolution.entity';
import { Modifier } from '../entities/modifier.entity';
import { CreatureInterceptorModifierMixin } from '../modifier-mixins/interceptor.mixin';
import { WhileOnBoardModifierMixin } from '../modifier-mixins/while-on-board.mixin';

export class AttackBuffModifier<T extends Creature | Evolution> extends Modifier<T> {
  constructor(id: string, game: Game, card: T, stacks = 1) {
    super(id, game, card, {
      stackable: true,
      initialStacks: stacks,
      mixins: [
        new WhileOnBoardModifierMixin(game),
        new CreatureInterceptorModifierMixin(game, {
          key: 'atk',
          interceptor(value, ctx, modifier) {
            return value + modifier.stacks;
          }
        })
      ]
    });
  }
}
