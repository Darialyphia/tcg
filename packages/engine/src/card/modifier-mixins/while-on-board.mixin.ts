import type { Game } from '../../game/game';
import { CREATURE_EVENTS } from '../card.enums';
import { SelfEventModifierMixin } from './self-event.mixin';

export class WhileOnBoardModifierMixin extends SelfEventModifierMixin<'after_destroyed'> {
  constructor(game: Game) {
    super(game, {
      eventName: CREATURE_EVENTS.AFTER_DESTROYED,
      handler: (event, modifier) => {
        modifier.target.removeModifier(modifier as any);
      }
    });
  }
}
