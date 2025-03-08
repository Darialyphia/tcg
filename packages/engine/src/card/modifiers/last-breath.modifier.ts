import type { Game } from '../../game/game';
import { KEYWORDS } from '../card-keyword';
import { CREATURE_EVENTS } from '../card.enums';
import type { DestroyedEvent } from '../card.events';
import type { Creature } from '../entities/creature.entity';
import { Modifier } from '../entities/modifier.entity';
import { KeywordModifierMixin } from '../modifier-mixins/keyword.mixin';
import { SelfEventModifierMixin } from '../modifier-mixins/self-event.mixin';

export class LastBreathModifier<T extends Creature> extends Modifier<T> {
  constructor(game: Game, card: T, handler: (event: DestroyedEvent) => void) {
    super(KEYWORDS.SUMMON.id, game, card, {
      stackable: false,
      name: KEYWORDS.SUMMON.name,
      description: KEYWORDS.SUMMON.description,
      mixins: [
        new KeywordModifierMixin(game, KEYWORDS.SUMMON),
        new SelfEventModifierMixin(game, {
          eventName: CREATURE_EVENTS.AFTER_DESTROYED,
          handler(event) {
            if (card.player.currentlyPlayedCard?.equals(card)) {
              handler(event);
            }
          }
        })
      ]
    });
  }
}
