import { assert, isDefined, type Nullable } from '@game/shared';
import { SPELL_KINDS } from '../../card/card.enums';
import type { AnyCard } from '../../card/entities/card.entity';
import { Creature } from '../../card/entities/creature.entity';
import { Evolution } from '../../card/entities/evolution.entity';
import type { Hero } from '../../card/entities/hero.entity';
import type { Shard } from '../../card/entities/shard.entity';
import { Spell } from '../../card/entities/spell.entity';
import type { Player } from '../../player/player.entity';
import { System } from '../../system';
import type { DeckCard } from '../../card/entities/deck.entity';

export type CreatureSlot = 0 | 1 | 2 | 3 | 4;

type CreatureZone = {
  creatures: [
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>,
    Nullable<Creature | Evolution>
  ];
  enchants: Spell[];
};

type ColumnEnchants = [
  Nullable<Spell>,
  Nullable<Spell>,
  Nullable<Spell>,
  Nullable<Spell>,
  Nullable<Spell>
];

class BoardSide {
  readonly player: Player;
  private _attackZone: CreatureZone;
  private _defenseZone: CreatureZone;
  private heroZone: { hero: Hero; enchants: Spell[] };
  private manaZone: AnyCard[];
  private shardZone: Nullable<Shard>;

  constructor(player: Player) {
    this.player = player;
    this._attackZone = { creatures: [null, null, null, null, null], enchants: [] };
    this._defenseZone = { creatures: [null, null, null, null, null], enchants: [] };
    this.heroZone = { hero: player.hero, enchants: [] };
    this.manaZone = [];
    this.shardZone = null;
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
    const attackZoneIndex = this.attackZone.creatures.findIndex(creature =>
      creature?.equals(card)
    );
    if (attackZoneIndex >= 0) {
      return { zone: 'attack' as const, slot: attackZoneIndex as CreatureSlot };
    }

    const defenseZoneIndex = this.defenseZone.creatures.findIndex(creature =>
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
    return this.getZone(zone).creatures[slot];
  }

  getAllCardsInPlay(): AnyCard[] {
    return [
      ...this.attackZone.creatures.filter(isDefined),
      ...this.defenseZone.creatures.filter(isDefined),
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
    assert(!this.isOccupied(zone, slot), 'Slot is already occupied');

    this.getZone(zone).creatures[slot] = card;
  }

  isOccupied(zone: 'attack' | 'defense', slot: CreatureSlot): boolean {
    return isDefined(this.getZone(zone).creatures[slot]);
  }

  getCreatures(zone: 'attack' | 'defense'): (Creature | Evolution)[] {
    return this.getZone(zone).creatures.filter(isDefined);
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

    this.getZone(to.zone).creatures[to.slot] = this.getZone(from.zone).creatures[
      from.slot
    ];
    this.getZone(from.zone).creatures[from.slot] = null;
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
    assert(!this.shardZone, 'Shard zone is already occupied');
    this.shardZone = shard;
  }

  placeToManaZone(card: DeckCard) {
    this.manaZone.push(card);
  }

  remove(card: Creature | Evolution | Spell) {
    if (card instanceof Creature || card instanceof Evolution) {
      const zone = card.position!.zone;
      this.getZone(zone).creatures[card.position!.slot] = null;
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
}

export class GameBoardSystem extends System<never> {
  sides!: [BoardSide, BoardSide];

  columnEnchants: ColumnEnchants = [null, null, null, null, null];

  initialize(): void {
    this.sides = this.game.playerSystem.players.map(player => new BoardSide(player)) as [
      BoardSide,
      BoardSide
    ];
  }

  shutdown() {}
}
