import { CARD_SETS, type CardSetId } from '../card.enums';
import type { CardSet } from '../entities/card-set.entity';
import { coreSet } from './core/core.set';

export const CARD_SET_DICTIONARY = {
  [CARD_SETS.CORE]: coreSet
} as const satisfies Record<CardSetId, CardSet>;
