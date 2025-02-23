import type { Game } from '../../game/game';
import { KEYWORDS } from '../card-keyword';
import { CREATURE_EVENTS } from '../card.enums';
import type { Creature } from '../entities/creature.entity';
import type { Evolution } from '../entities/evolution.entity';
import { Modifier } from '../entities/modifier.entity';
import { KeywordModifierMixin } from '../modifier-mixins/keyword.mixin';
import { SelfEventModifierMixin } from '../modifier-mixins/self-event.mixin';

export class SummonModifier<T extends Creature | Evolution> extends Modifier<T> {
  constructor(game: Game, card: T, handler: () => void) {
    super(KEYWORDS.SUMMON.id, game, card, {
      stackable: false,
      name: KEYWORDS.SUMMON.name,
      description: KEYWORDS.SUMMON.description,
      mixins: [
        new KeywordModifierMixin(game, KEYWORDS.SUMMON),
        new SelfEventModifierMixin(game, {
          eventName: CREATURE_EVENTS.AFTER_PLAY,
          handler() {
            if (card.player.currentlyPlayedCard?.equals(card)) {
              handler();
            }
          }
        })
      ]
    });
  }
}
