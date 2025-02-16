import type { Values } from '@game/shared';
import { Faction } from './entities/faction.entity';

export const CARD_EVENTS = {
  BEFORE_PLAY: 'before_play',
  AFTER_PLAY: 'after_play'
} as const;
export type CardEvent = Values<typeof CARD_EVENTS>;

export const CREATURE_EVENTS = {
  ...CARD_EVENTS,
  BEFORE_ATTACK: 'before_attack',
  AFTER_ATTACK: 'after_attack',
  BEFORE_BLOCK: 'before_block',
  AFTER_BLOCK: 'after_block',
  BEFORE_DESTROYED: 'before_destroyed',
  AFTER_DESTROYED: 'after_destroyed',
  BEFORE_DEAL_DAMAGE: 'before_deal_damage',
  AFTER_DEAL_DAMAGE: 'after_deal_damage',
  BEFORE_TAKE_DAMAGE: 'before_take_damage',
  AFTER_TAKE_DAMAGE: 'after_take_damage'
  // BEFORE_USE_ABILITY: 'before_use_ability',
  // AFTER_USE_ABILITY: 'after_use_ability'
} as const;
export type CreatureCardEvent = Values<typeof CREATURE_EVENTS>;

export const EVOLUTION_EVENTS = { ...CREATURE_EVENTS } as const;
export type EvolutionCardEvent = Values<typeof EVOLUTION_EVENTS>;

export const SPELL_EVENTS = {
  ...CARD_EVENTS,
  BEFORE_DESTROYED: 'before_destroyed',
  AFTER_DESTROYED: 'after_destroyed'
} as const;
export type SpellCardEvent = Values<typeof SPELL_EVENTS>;

export const HERO_EVENTS = { ...CARD_EVENTS } as const;
export type HeroCardEvent = Values<typeof HERO_EVENTS>;

export const SHARD_EVENTS = { ...CARD_EVENTS } as const;
export type ShardCardEvent = Values<typeof SHARD_EVENTS>;

export const CARD_KINDS = {
  CREATURE: 'CREATURE',
  SPELL: 'SPELL',
  SHARD: 'SHARD',
  EVOLUTION: 'EVOLUTION',
  HERO: 'HERO'
} as const;
export type CardKind = Values<typeof CARD_KINDS>;

export const SPELL_KINDS = {
  CAST: 'CAST',
  BURST: 'BURST',
  ROW_ENCHANT: 'ROW_ENCHANT',
  COLUMN_ENCHANT: 'COLUMN_ENCHANT',
  CREATURE_ENCHANT: 'CREATURE_ENCHANT',
  HERO_ENCHANT: 'HERO_ENCHANT'
} as const;
export type SpellKind = Values<typeof SPELL_KINDS>;

export const CREATURE_JOB = {
  STRIKER: 'STRIKER',
  AVENGER: 'AVENGER',
  GUARDIAN: 'GUARDIAN',
  SORCERER: 'SORCERER',
  WANDERER: 'WANDERER'
};
export type CreatureJob = Values<typeof CREATURE_JOB>;

export const CARD_SETS = {
  CORE: 'CORE'
} as const;

export type CardSetId = Values<typeof CARD_SETS>;

export const FACTION_IDS = {
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6'
} as const;

export type FactionId = Values<typeof FACTION_IDS>;

export const FACTIONS = {
  F1: new Faction(FACTION_IDS.F1, 'Fire'),
  F2: new Faction(FACTION_IDS.F2, 'Water'),
  F3: new Faction(FACTION_IDS.F3, 'Air'),
  F4: new Faction(FACTION_IDS.F4, 'Earth'),
  F5: new Faction(FACTION_IDS.F5, 'Light'),
  F6: new Faction(FACTION_IDS.F6, 'Dark')
} as const satisfies Record<string, Faction>;

export const RARITIES = {
  BASIC: 'basic',
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  TOKEN: 'token'
} as const;

export type Rarity = Values<typeof RARITIES>;
