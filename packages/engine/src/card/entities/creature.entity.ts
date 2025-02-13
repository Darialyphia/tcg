import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { Ability, CreatureBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import {
  CardAfterPlayEvent,
  CardBeforePlayEvent,
  AttackEvent,
  type CreatureEventMap,
  BlockEvent,
  BeforeDealDamageEvent,
  AfterDealDamageEvent,
  TakeDamageEvent
} from '../card.events';
import {
  CombatDamage,
  type Attacker,
  type Damage,
  type Defender
} from '../../combat/damage';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { HealthComponent } from '../../combat/health.component';
import { CREATURE_EVENTS } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import type { CreatureSlot } from '../../game/systems/game-board.system';
import { assert, isDefined, type Nullable } from '@game/shared';
import type { SelectedTarget } from '../../game/systems/interaction.system';
import { Hero } from './hero.entity';
import { PLAYER_EVENTS } from '../../player/player-enums';

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

  private _isExhausted = false;

  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
    this.health = new HealthComponent({
      initialValue: this.maxHp
    });
    this.forwardListeners();
    this.player.on(PLAYER_EVENTS.START_TURN, () => {
      this._isExhausted = false;
    });
    this.blueprint.onInit(this.game, this);
  }

  get isExhausted() {
    return this._isExhausted;
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

  get position(): Nullable<{ zone: 'attack' | 'defense'; slot: CreatureSlot }> {
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
      this.game.interaction.startSelectingTargets({
        getNextTarget: targets => {
          if (targets.length) {
            return null;
          }

          return {
            type: 'creatureSlot',
            isElligible: ({ zone, slot }) => !this.player.boardSide.isOccupied(zone, slot)
          };
        },
        canCommit: targets => targets.length > 0,
        onComplete: targets => {
          const target = targets[0];
          assert(target.type === 'creatureSlot', 'Expected target to be a creature slot');
          this.playAt(target.zone, target.slot);
        }
      });
    }
  }

  playAt(zone: 'attack' | 'defense', slot: CreatureSlot) {
    this.emitter.emit(CREATURE_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
    this.player.spendMana(this.manaCost);

    this.player.boardSide.summonCreature(this, zone, slot);
    this.blueprint.onPlay(this.game, this);
    this.emitter.emit(CREATURE_EVENTS.AFTER_PLAY, new CardAfterPlayEvent({}));
  }

  private resolveAbility(ability: Ability<Creature>, targets: SelectedTarget[]) {
    this.player.spendMana(ability.manaCost);
    ability.onResolve(this.game, this, targets);
    this._isExhausted = true;
  }

  selectAbilityTargets(
    ability: Ability<Creature>,
    onComplete: (targets: SelectedTarget[]) => void
  ) {
    assert(
      this.blueprint.abilities.includes(ability),
      "The ability doesn't belong to this creature"
    );

    this.game.interaction.startSelectingTargets({
      getNextTarget: targets => ability.followup.targets[targets.length] ?? null,
      canCommit: ability.followup.canCommit,
      onComplete
    });
  }

  addAbilityToChain(index: number) {
    assert(!this.isExhausted, 'Creature is exhausted');
    assert(this.game.effectChainSystem.currentChain, 'No ongoing effect chain');
    const ability = this.blueprint.abilities[index];
    assert(isDefined(ability), 'Ability not found');

    const chain = this.game.effectChainSystem.currentChain;

    this.selectAbilityTargets(ability, targets => {
      chain.addEffect(() => {
        this.resolveAbility(this.blueprint.abilities[index], targets);
      }, this.player);
    });
  }

  declareAbility(index: number) {
    assert(!this.isExhausted, 'Creature is exhausted');
    assert(
      !this.game.effectChainSystem.currentChain,
      'There is already an ongoing chain'
    );
    const ability = this.blueprint.abilities[index];
    assert(isDefined(ability), 'Ability not found');

    this.selectAbilityTargets(ability, targets => {
      this.game.effectChainSystem.createChain(this.player, () => {});
      this.game.effectChainSystem.start(() => {
        this.resolveAbility(this.blueprint.abilities[index], targets);
      }, this.player);
    });
  }

  declareAttack(target: Defender) {
    assert(!this.isExhausted, 'Creature is exhausted');
    this._isExhausted = true;
    this.game.interaction.declareAttack(this, target);
  }

  declareBlocker() {
    assert(!this._isExhausted, 'Creature is exhausted');
    this._isExhausted = true;
    this.game.interaction.declareBlocker(this);
  }

  attack(target: Defender, isBlocked: boolean) {
    if (this.isDead) return;
    if (target.isDead) return;

    this.emitter.emit(CREATURE_EVENTS.BEFORE_ATTACK, new AttackEvent({ target }));
    if (isBlocked) {
      assert(!(target instanceof Hero), 'Hero cannot block');
      target.block(this, () => {
        this.dealDamage(target);
      });
    } else {
      this.dealDamage(target);
    }
    this.emitter.emit(CREATURE_EVENTS.AFTER_ATTACK, new AttackEvent({ target }));
  }

  block(attacker: Attacker, cb: () => void) {
    this.emitter.emit(CREATURE_EVENTS.BEFORE_BLOCK, new BlockEvent({ attacker }));
    cb();
    this.emitter.emit(CREATURE_EVENTS.AFTER_BLOCK, new BlockEvent({ attacker }));
  }

  dealDamage(target: Defender) {
    this.emitter.emit(
      CREATURE_EVENTS.BEFORE_DEAL_DAMAGE,
      new BeforeDealDamageEvent({ target })
    );
    const damage = new CombatDamage({
      baseAmount: this.atk,
      source: this
    });
    target.receiveDamage(damage);
    this.emitter.emit(
      CREATURE_EVENTS.AFTER_DEAL_DAMAGE,
      new AfterDealDamageEvent({ target, damage })
    );
  }

  receiveDamage(damage: Damage<AnyCard>) {
    this.emitter.emit(
      CREATURE_EVENTS.BEFORE_TAKE_DAMAGE,
      new TakeDamageEvent({ damage, source: damage.source, target: this })
    );
    this.health.remove(damage.getFinalAmount(this));
    this.emitter.emit(
      CREATURE_EVENTS.AFTER_TAKE_DAMAGE,
      new TakeDamageEvent({ damage, source: damage.source, target: this })
    );
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
