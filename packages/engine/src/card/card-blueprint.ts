import type { Game } from '../game/game';
import type { Keyword } from './card-keyword';
import type {
  CARD_KINDS,
  CardKind,
  CardSet,
  CreatureJob,
  Rarity,
  SpellKind
} from './card.enums';
import type { Creature } from './entities/creature.entity';
import type { Evolution } from './entities/evolution.entity';
import type { Faction } from './entities/faction.entity';
import type { Shard } from './entities/shard.entity';
import type { Spell } from './entities/spell.entity';

export type CardBlueprintBase = {
  id: string;
  name: string;
  set: CardSet;
  imageId: string;
  description: string;
  faction: Faction | null;
  rarity: Rarity;
};

export type CreatureBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.CREATURE>;
  manaCost: number;
  job: CreatureJob;
  keywords: Keyword[];
  maxHp: number;
  atk: number;
  onInit(game: Game, card: Creature): void;
  onPlay(game: Game, card: Creature): void;
};

export type SpellBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.SPELL>;
  manaCost: number;
  spellKind: SpellKind;
  onPlay(game: Game, card: Spell): void;
};

export type ShardBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.SHARD>;
  onPlay(game: Game, card: Shard): void;
};

export type EvolutionBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.EVOLUTION>;
  job: CreatureJob;
  manaCost: number;
  keywords: Keyword[];
  maxHp: number;
  atk: number;
  onPlay(game: Game, card: Evolution): void;
};

export type HeroBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.HERO>;
  maxHp: number;
};

export type CardBlueprint =
  | CreatureBlueprint
  | SpellBlueprint
  | ShardBlueprint
  | EvolutionBlueprint
  | HeroBlueprint;
