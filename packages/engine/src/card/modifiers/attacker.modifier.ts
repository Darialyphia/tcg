import type { Game } from '../../game/game';
import { KEYWORDS } from '../card-keyword';
import { CREATURE_EVENTS } from '../card.enums';
import type { Creature } from '../entities/creature.entity';
import { Modifier } from '../entities/modifier.entity';
import { KeywordModifierMixin } from '../modifier-mixins/keyword.mixin';
import { SelfEventModifierMixin } from '../modifier-mixins/self-event.mixin';
import { AttackBuffModifier } from './attack-buff.modifier';

export const ATTACKER_BUFF_ID = 'attacker_buff';
export class AttackerModifier<T extends Creature> extends Modifier<T> {
  constructor(game: Game, card: T, value: number) {
    super(KEYWORDS.ATTACKER.id, game, card, {
      stackable: false,
      name: KEYWORDS.ATTACKER.name,
      description: KEYWORDS.ATTACKER.description,
      mixins: [
        new KeywordModifierMixin(game, KEYWORDS.ATTACKER),
        new SelfEventModifierMixin(game, {
          eventName: CREATURE_EVENTS.AFTER_PLAY,
          handler() {
            if (card.position?.zone === 'attack') {
              card.addModifier(
                new AttackBuffModifier(ATTACKER_BUFF_ID, game, card, value)
              );
            }
          }
        })
      ]
    });
  }
}
