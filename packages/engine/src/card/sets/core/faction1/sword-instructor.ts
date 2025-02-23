import type { CreatureBlueprint } from '../../../card-blueprint';
import { KEYWORDS } from '../../../card-keyword';
import {
  CARD_KINDS,
  CARD_SETS,
  CREATURE_JOB,
  FACTIONS,
  RARITIES
} from '../../../card.enums';
import type { CardTarget } from '../../../../game/systems/interaction.system';
import { AttackBuffModifier } from '../../../modifiers/attack-buff.modifier';
import type { Creature } from '../../../entities/creature.entity';
import { isDefined } from '@game/shared';

export const f1SwordInstructor: CreatureBlueprint = {
  id: 'f1-sword-instructor',
  kind: CARD_KINDS.CREATURE,
  name: 'Sword Instructor',
  description: '',
  faction: FACTIONS.F1,
  imageId: 'fire-shard',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  abilities: [
    {
      description: 'Summon: Give +2 Attack to an ally.',
      manaCost: 3,
      getFollowup(game, card) {
        return {
          targets: [
            {
              type: 'card',
              isElligible(candidate) {
                return isDefined(card.position) && candidate.player.equals(card.player);
              }
            }
          ],
          canCommit(targets) {
            return targets.length === 1;
          }
        };
      },
      onResolve(game, card, targets) {
        const target = (targets as CardTarget[])[0].card as Creature;

        target.addModifier(
          new AttackBuffModifier('sword_instructor_buff', game, target, 2)
        );
      }
    }
  ],
  manaCost: 4,
  atk: 2,
  maxHp: 4,
  job: CREATURE_JOB.GUARDIAN,
  keywords: [KEYWORDS.ATTACKER],
  onInit() {},
  onPlay() {}
};
