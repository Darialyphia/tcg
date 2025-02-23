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

export const f1Rogue: CreatureBlueprint = {
  id: 'f1-rogue',
  kind: CARD_KINDS.CREATURE,
  name: 'Rogue',
  description: '@Attacker(1)@.',
  faction: FACTIONS.F1,
  imageId: 'rogue',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  abilities: [],
  manaCost: 1,
  atk: 1,
  maxHp: 1,
  job: CREATURE_JOB.STRIKER,
  keywords: [KEYWORDS.ATTACKER],
  onInit: () => {},
  onPlay(game, card) {
    card.addModifier(new AttackerModifier(game, card, 1));
  }
};
