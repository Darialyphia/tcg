import { isDefined } from '@game/shared';
import type { AnyCard } from '../entities/card.entity';
import { Creature } from '../entities/creature.entity';
import type { Player } from '../../player/player.entity';

export const isUnit = (card: AnyCard): card is Creature => {
  return card instanceof Creature;
};

export const isSummonedUnit = (card: AnyCard): card is Creature => {
  return isUnit(card) && isDefined(card.position);
};

export const isSummonedAlly = (card: AnyCard, player: Player): card is Creature => {
  return isSummonedUnit(card) && card.player.equals(player);
};

export const isSummonedEnemy = (card: AnyCard, player: Player): card is Creature => {
  return isSummonedUnit(card) && !card.player.equals(player);
};
