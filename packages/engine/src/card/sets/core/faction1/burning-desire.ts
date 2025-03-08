import { isDefined } from '@game/shared';
import type { SpellBlueprint } from '../../../card-blueprint';
import {
  CARD_KINDS,
  CARD_SETS,
  FACTIONS,
  RARITIES,
  SPELL_KINDS
} from '../../../card.enums';
import type { Creature } from '../../../entities/creature.entity';
import type { CardTarget } from '../../../../game/systems/interaction.system';
import { SpellDamage } from '../../../../combat/damage';

export const f1BurningDesire: SpellBlueprint = {
  id: 'f1-burning-desire',
  kind: CARD_KINDS.SPELL,
  name: 'Burning Desire',
  description: 'Draw 2 cards and deal 2 damage to your hero.',
  faction: FACTIONS.F1,
  imageId: 'fireball',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  manaCost: 2,
  spellKind: SPELL_KINDS.BURST,
  followup: {
    targets: [],
    canCommit() {
      return true;
    }
  },
  onInit: () => {},
  onPlay(game, card) {
    card.player.draw(2);
    card.player.hero.receiveDamage(
      new SpellDamage({
        baseAmount: 2,
        source: card
      })
    );
  }
};
