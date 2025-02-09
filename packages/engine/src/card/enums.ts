import type { Values } from '@game/shared';

export const CARD_TYPES = {
  CREATURE: 'CREATURE',
  SPELL: 'SPELL',
  TRAP: 'TRAP'
} as const;
export type CardType = Values<typeof CARD_TYPES>;

export const SPELL_TYPES = {
  CAST: 'CAST',
  BURST: 'BURST',
  ROW_ENCHANT: 'ROW_ENCHANT',
  COLUMN_ENCHANT: 'COLUMN_ENCHANT',
  CREATURE_ENCHANT: 'CREATURE_ENCHANT',
  HERO_ENCHANT: 'HERO_ENCHANT'
} as const;
export type SpellType = Values<typeof SPELL_TYPES>;
