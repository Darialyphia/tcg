import { assert, isDefined, type Nullable, type Serializable } from '@game/shared';
import { SPELL_KINDS, type SpellKind } from '../../card/card.enums';
import type { AnyCard, SerializedCard } from '../../card/entities/card.entity';
import { Creature, type SerializedCreature } from '../../card/entities/creature.entity';
import {
  Evolution,
  type SerializedEvolution
} from '../../card/entities/evolution.entity';
import type { Hero, SerializedHero } from '../../card/entities/hero.entity';
import type { SerializedShard, Shard } from '../../card/entities/shard.entity';
import { Spell, type SerializedSpell } from '../../card/entities/spell.entity';
import type { Player } from '../../player/player.entity';
import { System } from '../../system';
import type { DeckCard } from '../../card/entities/deck.entity';
import type { S } from 'vitest/dist/chunks/config.Cy0C388Z';

export type CreatureSlot = 0 | 1 | 2 | 3 | 4;

type CreatureZone = {
  slots: [
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>
  ];
  enchants: Spell[];
};

type ColumnEnchants = [
  Array<Spell>,
  Array<Spell>,
  Array<Spell>,
  Array<Spell>,
  Array<Spell>
];

type SerializedCreatureZone = {
  slots: [
    SerializedCreature | SerializedEvolution | null,
    SerializedCreature | SerializedEvolution | null,
    SerializedCreature | SerializedEvolution | null,
    SerializedCreature | SerializedEvolution | null,
    SerializedCreature | SerializedEvolution | null
  ];
  enchants: SerializedSpell[];
};

export type SerializedBoardSide = {
  playerId: string;
  hero: {
    card: SerializedHero;
    enchants: SerializedSpell[];
  };
  attackZone: SerializedCreatureZone;
  defenseZone: SerializedCreatureZone;
  manaZone: SerializedCard[];
  shardZone: SerializedShard | null;
  evolution: Array<SerializedEvolution>;
  hand: Array<SerializedCreature | SerializedSpell | SerializedShard>;
  deck: { total: number; remaining: number };
};

export type SerializedBoard = {
  sides: [SerializedBoardSide, SerializedBoardSide];
  columnEnchants: [
    Array<SerializedSpell>,
    Array<SerializedSpell>,
    Array<SerializedSpell>,
    Array<SerializedSpell>,
    Array<SerializedSpell>
  ];
};

class BoardSide implements Serializable<SerializedBoardSide> {
  readonly player: Player;
  private _attackZone: CreatureZone;
  private _defenseZone: CreatureZone;
  private heroZone: { hero: Hero; enchants: Spell[] };
  private manaZone: AnyCard[];
  private shardZone: Nullable<Shard>;

  constructor(player: Player) {
    this.player = player;
    this._attackZone = { slots: [null, null, null, null, null], enchants: [] };
    this._defenseZone = { slots: [null, null, null, null, null], enchants: [] };
    this.heroZone = { hero: player.hero, enchants: [] };
    this.manaZone = [];
    this.shardZone = null;
  }

  get hero() {
    return this.heroZone.hero;
  }

  get heroEnchants() {
    return this.heroZone.enchants;
  }

  get attackZone(): CreatureZone {
    return this._attackZone;
  }

  get defenseZone(): CreatureZone {
    return this._defenseZone;
  }

  private getZone(zone: 'attack' | 'defense'): CreatureZone {
    return zone === 'attack' ? this.attackZone : this.defenseZone;
  }

  convertShardToMana() {
    if (!this.shardZone) return;
    this.manaZone.push(this.shardZone);
    this.shardZone = null;
  }

  getPositionFor(card: Creature | Evolution) {
    const attackZoneIndex = this.attackZone.slots.findIndex(creature =>
      creature?.equals(card)
    );
    if (attackZoneIndex >= 0) {
      return { zone: 'attack' as const, slot: attackZoneIndex as CreatureSlot };
    }

    const defenseZoneIndex = this.defenseZone.slots.findIndex(creature =>
      creature?.equals(card)
    );
    if (defenseZoneIndex >= 0) {
      return { zone: 'defense' as const, slot: defenseZoneIndex as CreatureSlot };
    }

    return null;
  }

  getCreatureAt(
    zone: 'attack' | 'defense',
    slot: CreatureSlot
  ): Nullable<Creature | Evolution> {
    return this.getZone(zone).slots[slot];
  }

  getAllCardsInPlay(): AnyCard[] {
    return [
      ...this.attackZone.slots.filter(isDefined),
      ...this.defenseZone.slots.filter(isDefined),
      ...this.attackZone.enchants,
      ...this.defenseZone.enchants,
      ...this.heroZone.enchants
    ];
  }

  summonCreature(
    card: Creature | Evolution,
    zone: 'attack' | 'defense',
    slot: CreatureSlot
  ) {
    assert(!this.isOccupied(zone, slot), new CreatureSlotAlreadyOccupiedError());

    this.getZone(zone).slots[slot] = card;
  }

  isOccupied(zone: 'attack' | 'defense', slot: CreatureSlot): boolean {
    return isDefined(this.getZone(zone).slots[slot]);
  }

  get hasUnoccupiedSlot() {
    return !(
      this.attackZone.slots.every(isDefined) && this.defenseZone.slots.every(isDefined)
    );
  }

  getCreatures(zone: 'attack' | 'defense'): (Creature | Evolution)[] {
    return this.getZone(zone).slots.filter(isDefined);
  }

  getAllCreatures(): (Creature | Evolution)[] {
    return [...this.attackZone.slots, ...this.defenseZone.slots].filter(isDefined);
  }

  getAdjacentCreatures(
    zone: 'attack' | 'defense',
    slot: CreatureSlot
  ): Array<Creature | Evolution> {
    if (zone === 'attack') {
      return [
        this.player.boardSide.getCreatureAt('attack', (slot - 1) as CreatureSlot),
        this.player.boardSide.getCreatureAt('attack', (slot + 1) as CreatureSlot),
        this.player.boardSide.getCreatureAt('defense', slot),
        this.player.opponent.boardSide.getCreatureAt('attack', slot)
      ].filter(isDefined);
    } else {
      return [
        this.player.boardSide.getCreatureAt('defense', (slot - 1) as CreatureSlot),
        this.player.boardSide.getCreatureAt('defense', (slot + 1) as CreatureSlot),
        this.player.boardSide.getCreatureAt('attack', slot)
      ].filter(isDefined);
    }
  }

  moveCreature(
    from: { zone: 'attack' | 'defense'; slot: CreatureSlot },
    to: { zone: 'attack' | 'defense'; slot: CreatureSlot }
  ) {
    if (from.zone === to.zone && from.slot === to.slot) return;

    assert(!this.isOccupied(from.zone, from.slot), 'No creature in slot');
    assert(this.isOccupied(to.zone, to.slot), 'Target slot occupied');

    this.getZone(to.zone).slots[to.slot] = this.getZone(from.zone).slots[from.slot];
    this.getZone(from.zone).slots[from.slot] = null;
  }

  placeRowEnchant(zone: 'attack' | 'defense', spell: Spell) {
    assert(spell.spellKind === SPELL_KINDS.ROW_ENCHANT, 'Spell is not a row enchant');
    this.getZone(zone).enchants.push(spell);
  }

  placeHeroEnchant(spell: Spell): boolean {
    assert(spell.spellKind === SPELL_KINDS.HERO_ENCHANT, 'Spell is not a hero enchant');
    this.heroZone.enchants.push(spell);
    return true;
  }

  placeShard(shard: Shard) {
    assert(!this.shardZone, new ShardZoneAlreadyOccupiedError());
    this.shardZone = shard;
  }

  get isShardZoneOccupied() {
    return !!this.shardZone;
  }

  placeToManaZone(card: DeckCard) {
    this.manaZone.push(card);
  }

  remove(card: Creature | Evolution | Spell) {
    if (card instanceof Creature || card instanceof Evolution) {
      const zone = card.position!.zone;
      this.getZone(zone).slots[card.position!.slot] = null;
    } else if (card instanceof Spell) {
      this.attackZone.enchants = this.attackZone.enchants.filter(
        enchant => !enchant.equals(card)
      );
      this.defenseZone.enchants = this.defenseZone.enchants.filter(
        enchant => !enchant.equals(card)
      );
      this.heroZone.enchants = this.heroZone.enchants.filter(
        enchant => !enchant.equals(card)
      );
    }

    this.player.sendToDiscardPile(card);
  }

  get totalMana() {
    return this.manaZone.length;
  }

  serialize(): SerializedBoardSide {
    return {
      playerId: this.player.id,
      hero: {
        card: this.hero.serialize(),
        enchants: this.heroEnchants.map(enchant => enchant.serialize())
      },
      attackZone: {
        slots: this.attackZone.slots.map(creature =>
          creature ? creature.serialize() : null
        ) as SerializedCreatureZone['slots'],
        enchants: this.attackZone.enchants.map(enchant => enchant.serialize())
      },
      defenseZone: {
        slots: this.defenseZone.slots.map(creature =>
          creature ? creature.serialize() : null
        ) as SerializedCreatureZone['slots'],
        enchants: this.defenseZone.enchants.map(enchant => enchant.serialize())
      },
      manaZone: this.manaZone.map(card => card.serialize()),
      shardZone: this.shardZone ? this.shardZone.serialize() : null,
      evolution: this.player.evolutions.map(evolution => evolution.serialize()),
      hand: this.player.hand.map(card => card.serialize()),
      deck: {
        total: this.player.deckSize,
        remaining: this.player.deck.remaining
      }
    };
  }
}

export class GameBoardSystem
  extends System<never>
  implements Serializable<SerializedBoard>
{
  sides!: [BoardSide, BoardSide];

  columnEnchants: ColumnEnchants = [[], [], [], [], []];

  initialize(): void {
    this.sides = this.game.playerSystem.players.map(player => new BoardSide(player)) as [
      BoardSide,
      BoardSide
    ];
  }

  shutdown() {}

  getAllCardsInPlay(): AnyCard[] {
    return this.sides.flatMap(side => side.getAllCardsInPlay());
  }

  serialize(): SerializedBoard {
    return {
      sides: this.sides.map(side => side.serialize()) as [
        SerializedBoardSide,
        SerializedBoardSide
      ],
      columnEnchants: this.columnEnchants.map(column =>
        column.map(enchant => enchant.serialize())
      ) as SerializedBoard['columnEnchants']
    };
  }
}

export class CreatureSlotAlreadyOccupiedError extends Error {
  constructor() {
    super('Creature slot is already occupied');
  }
}

export class ShardZoneAlreadyOccupiedError extends Error {
  constructor() {
    super('Shard zone is already occupied');
  }
}
