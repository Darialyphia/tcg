import type { Game } from '../game/game';
import type { EffectTarget, SelectedTarget } from '../game/systems/interaction.system';
import type { Keyword } from './card-keyword';
import type {
  CARD_KINDS,
  CardKind,
  CardSetId,
  CreatureJob,
  Rarity,
  SpellKind
} from './card.enums';
import type { AnyCard } from './entities/card.entity';
import type { Creature } from './entities/creature.entity';
import type { Faction } from './entities/faction.entity';
import type { Hero } from './entities/hero.entity';
import type { Shard } from './entities/shard.entity';
import type { Spell } from './entities/spell.entity';

export type CardBlueprintBase = {
  id: string;
  name: string;
  setId: CardSetId;
  imageId: string;
  description: string;
  faction: Faction | null;
  rarity: Rarity;
};

export type Ability<T extends AnyCard> = {
  manaCost: number;
  description: string;
  getFollowup(
    game: Game,
    card: T
  ): {
    targets: EffectTarget[];
    canCommit: (targets: SelectedTarget[]) => boolean;
  };
  onResolve: <TTarget extends SelectedTarget>(
    game: Game,
    card: T,
    targets: TTarget[]
  ) => void;
};

export type CreatureBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.CREATURE>;
  manaCost: number;
  job: CreatureJob;
  keywords: Keyword[];
  maxHp: number;
  atk: number;
  abilities: Array<Ability<Creature>>;
  loyalty: number;
  onInit(game: Game, card: Creature): void;
  onPlay(game: Game, card: Creature): void;
};

export type SpellBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.SPELL>;
  manaCost: number;
  spellKind: SpellKind;
  loyalty: number;
  followup: {
    targets: EffectTarget[];
    canCommit: (targets: SelectedTarget[]) => boolean;
  };
  onInit(game: Game, card: Spell): void;
  onPlay(game: Game, card: Spell, targets: SelectedTarget[]): void;
};

export type ShardBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.SHARD>;
  loyalty: number;
  onInit(game: Game, card: Shard): void;
  onPlay(game: Game, card: Shard): void;
};

export type HeroBlueprint = CardBlueprintBase & {
  kind: Extract<CardKind, typeof CARD_KINDS.HERO>;
  maxHp: number;
  abilities: Array<Ability<Hero>>;
  faction: Faction;
};

export type CardBlueprint =
  | CreatureBlueprint
  | SpellBlueprint
  | ShardBlueprint
  | HeroBlueprint;
