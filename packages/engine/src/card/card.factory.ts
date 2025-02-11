import { match } from 'ts-pattern';
import type { Game } from '../game/game';
import type { Player } from '../player/player.entity';
import type { AnyCard, CardOptions } from './entities/card.entity';
import { CARD_KINDS } from './card.enums';
import { Creature } from './entities/creature.entity';
import { Spell } from './entities/spell.entity';
import { Evolution } from './entities/evolution.entity';
import { Shard } from './entities/shard.entity';
import { Hero } from './entities/hero.entity';
import type {
  CardBlueprint,
  CreatureBlueprint,
  EvolutionBlueprint,
  HeroBlueprint,
  ShardBlueprint,
  SpellBlueprint
} from './card-blueprint';

export const createCard = <T extends CardBlueprint = CardBlueprint>(
  game: Game,
  player: Player,
  options: CardOptions<T>
): T extends CreatureBlueprint
  ? Creature
  : T extends HeroBlueprint
    ? Hero
    : T extends EvolutionBlueprint
      ? Evolution
      : T extends SpellBlueprint
        ? Spell
        : T extends ShardBlueprint
          ? Shard
          : AnyCard => {
  const card = match(options.blueprint.kind)
    .with(CARD_KINDS.CREATURE, () => new Creature(game, player, options))
    .with(CARD_KINDS.SPELL, () => new Spell(game, player, options))
    .with(CARD_KINDS.SHARD, () => new Shard(game, player, options))
    .with(CARD_KINDS.EVOLUTION, () => new Evolution(game, player, options))
    .with(CARD_KINDS.HERO, () => new Hero(game, player, options))
    .exhaustive();

  return card as any;
};

export const cardIdFactory = () => {
  let nextId = 0;
  return (blueprintId: string, playerId: string) =>
    `${playerId}_card_${blueprintId}_${nextId++}`;
};
