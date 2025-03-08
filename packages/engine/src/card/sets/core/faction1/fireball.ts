import type { SpellBlueprint } from '../../../card-blueprint';
import {
  CARD_KINDS,
  CARD_SETS,
  FACTIONS,
  RARITIES,
  SPELL_KINDS
} from '../../../card.enums';
import { isSummonedUnit } from '../../../utils/assertions';
import type { Creature } from '../../../entities/creature.entity';
import type { CardTarget } from '../../../../game/systems/interaction.system';
import { SpellDamage } from '../../../../combat/damage';

export const f1Fireball: SpellBlueprint = {
  id: 'f1-fireball',
  kind: CARD_KINDS.SPELL,
  name: 'Fireball',
  description: 'Deal 2 damage to target creature and all adjacent creatures.',
  faction: FACTIONS.F1,
  imageId: 'fireball',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  manaCost: 3,
  spellKind: SPELL_KINDS.CAST,
  followup: {
    targets: [
      {
        type: 'card',
        isElligible(candidate) {
          return isSummonedUnit(candidate);
        }
      }
    ],
    canCommit(targets) {
      return targets.length === 1;
    }
  },
  onInit: () => {},
  onPlay(game, card, targets) {
    const target = (targets[0] as CardTarget).card as Creature;
    const adjacentCreatures = target.player.boardSide.getAdjacentCreatures(
      target.position!.zone,
      target.position!.slot
    );

    [target, ...adjacentCreatures].forEach(creature => {
      creature.receiveDamage(
        new SpellDamage({
          baseAmount: 2,
          source: card
        })
      );
    });
  }
};
