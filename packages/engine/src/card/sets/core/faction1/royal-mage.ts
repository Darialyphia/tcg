import type { CreatureBlueprint, ShardBlueprint } from '../../../card-blueprint';
import { KEYWORDS } from '../../../card-keyword';
import {
  CARD_KINDS,
  CARD_SETS,
  CREATURE_JOB,
  FACTIONS,
  RARITIES
} from '../../../card.enums';
import { AttackerModifier } from '../../../modifiers/attacker.modifier';
import { LastBreathModifier } from '../../../modifiers/last-breath.modifier';

export const f1RoyalMage: CreatureBlueprint = {
  id: 'f1-royal-mage',
  kind: CARD_KINDS.CREATURE,
  name: 'Rogue',
  description: '@Attacker(1)@.\n@Last Breath@: draw a card.',
  faction: FACTIONS.F1,
  imageId: 'royal-mage',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  abilities: [],
  manaCost: 2,
  atk: 1,
  maxHp: 1,
  job: CREATURE_JOB.SORCERER,
  keywords: [KEYWORDS.ATTACKER, KEYWORDS.LAST_BREATH],
  onInit: () => {},
  onPlay(game, card) {
    card.addModifier(new AttackerModifier(game, card, 1));
    card.addModifier(
      new LastBreathModifier(game, card, () => {
        card.player.draw(1);
      })
    );
  }
};
