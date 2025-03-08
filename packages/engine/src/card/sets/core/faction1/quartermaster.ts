import type { CreatureBlueprint } from '../../../card-blueprint';
import { KEYWORDS } from '../../../card-keyword';
import {
  CARD_KINDS,
  CARD_SETS,
  CREATURE_JOB,
  FACTIONS,
  RARITIES
} from '../../../card.enums';
import { AttackBuffModifier } from '../../../modifiers/attack-buff.modifier';
import { SummonModifier } from '../../../modifiers/summon.modifier';
import { selectAlliedCreatureSlots } from '../../../utils/targeting-helpers';

export const f1Quartermaster: CreatureBlueprint = {
  id: 'f1-quartermaster',
  kind: CARD_KINDS.CREATURE,
  name: 'Quartermaster',
  description: '@Summon@: Increase the attack of a allied creature by 1.',
  faction: FACTIONS.F1,
  imageId: 'quartermaster',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  abilities: [],
  manaCost: 3,
  atk: 2,
  maxHp: 2,
  job: CREATURE_JOB.STRIKER,
  keywords: [KEYWORDS.SUMMON],
  onInit: () => {},
  onPlay(game, card) {
    card.addModifier(
      new SummonModifier(game, card, () => {
        selectAlliedCreatureSlots(game, card.player, 1, targets => {
          const [target] = targets;
          const creature = target.player.boardSide.getCreatureAt(
            target.zone,
            target.slot
          );
          if (!creature) return;

          creature.addModifier(
            // @ts-expect-error
            new AttackBuffModifier(game, creature, 1)
          );
        });
      })
    );
  }
};
