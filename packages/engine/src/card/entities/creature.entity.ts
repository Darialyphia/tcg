import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { CreatureBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import {
  CardAfterPlayEvent,
  CardBeforePlayEvent,
  type CreatureEventMap
} from '../card.events';
import type { Attacker, Damage, Defender } from '../../combat/damage';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { HealthComponent } from '../../combat/health.component';
import { CREATURE_EVENTS } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import type { CreatureSlot } from '../../game/game-board.system';
import type { Evolution } from './evolution.entity';
import { assert, isDefined } from '@game/shared';
import { t } from 'typescript-fsm';

export type SerializedCreature = SerializedCard & {
  atk: number;
  maxHp: number;
  job: string;
  manaCost: number;
};

const makeInterceptors = () => ({
  canAttack: new Interceptable<boolean, { target: Defender }>(),
  canBlock: new Interceptable<boolean, { attacker: Attacker }>(),
  canBeAttackTarget: new Interceptable<boolean, { attacker: Attacker }>(),

  manaCost: new Interceptable<number>(),
  maxHp: new Interceptable<number>(),
  atk: new Interceptable<number>(),

  damageDealt: new Interceptable<number, { target: Defender }>(),
  damageReceived: new Interceptable<
    number,
    { amount: number; source: AnyCard; damage: Damage<AnyCard> }
  >()
});
type CreatureInterceptors = ReturnType<typeof makeInterceptors>;

export class Creature extends Card<
  SerializedCreature,
  CreatureEventMap,
  CreatureInterceptors,
  CreatureBlueprint
> {
  readonly health: HealthComponent;

  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
    this.health = new HealthComponent({
      initialValue: this.maxHp
    });
    this.forwardListeners();
  }

  get atk(): number {
    return this.interceptors.atk.getValue(this.blueprint.atk, {});
  }

  get maxHp(): number {
    return this.interceptors.maxHp.getValue(this.blueprint.maxHp, {});
  }

  get hp() {
    return this.health.current;
  }

  get isDead() {
    return this.health.isDead;
  }

  get manaCost() {
    return this.interceptors.manaCost.getValue(this.blueprint.manaCost, {});
  }

  get job() {
    return this.blueprint.job;
  }

  get position() {
    return this.player.boardSide.getPositionFor(this);
  }

  get adjacentCreatures() {
    if (!this.position) {
      return [];
    }

    const { slot, zone } = this.position;
    return this.player.boardSide.getAdjacentCreatures(zone, slot);
  }

  getDealtDamage(target: Defender) {
    return this.interceptors.damageDealt.getValue(this.atk, {
      target
    });
  }

  getReceivedDamage<T extends AnyCard>(amount: number, damage: Damage<T>, from: AnyCard) {
    return this.interceptors.damageReceived.getValue(amount, {
      source: from,
      damage,
      amount
    });
  }

  play(location?: { slot: CreatureSlot; zone: 'attack' | 'defense' }) {
    if (isDefined(location)) {
      this.playAt(location.zone, location.slot);
    } else {
      this.game.interaction.startSelectingTargets(
        [
          {
            type: 'creatureSlot',
            isElligible: ({ zone, slot }) => !this.player.boardSide.isOccupied(zone, slot)
          }
        ],
        targets => !!targets.length,
        targets => {
          const target = targets[0];
          assert(target.type === 'creatureSlot', 'Expected target to be a creature slot');
          this.emitter.emit(CREATURE_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
          this.playAt(target.zone, target.slot);
          this.emitter.emit(CREATURE_EVENTS.AFTER_PLAY, new CardAfterPlayEvent({}));
        }
      );
    }
  }

  playAt(zone: 'attack' | 'defense', slot: CreatureSlot) {
    this.player.boardSide.summonCreature(this, zone, slot);
    this.blueprint.onPlay(this.game, this);
  }

  forwardListeners() {
    Object.values(CREATURE_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `card.${eventName}`,
          new GameCardEvent({ card: this, event: event as any }) as any
        );
      });
    });
  }

  serialize(): SerializedCreature {
    return {
      id: this.id,
      name: this.name,
      imageId: this.imageId,
      description: this.description,
      kind: this.kind,
      manaCost: this.manaCost,
      atk: this.atk,
      maxHp: this.maxHp,
      job: this.job,
      rarity: this.rarity,
      faction: this.faction?.serialize() ?? null,
      set: this.set.serialize()
    };
  }
}
