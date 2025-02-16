import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { Ability, EvolutionBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import {
  AfterDealDamageEvent,
  AttackEvent,
  BeforeDealDamageEvent,
  BlockEvent,
  CardAfterPlayEvent,
  CardBeforePlayEvent,
  DestroyedEvent,
  TakeDamageEvent,
  type EvolutionEventMap
} from '../card.events';
import {
  type Defender,
  type Attacker,
  type Damage,
  CombatDamage,
  LoyaltyDamage
} from '../../combat/damage';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { HealthComponent } from '../../combat/health.component';
import { EVOLUTION_EVENTS } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import { Creature } from './creature.entity';
import type { DeckCard } from './deck.entity';
import type { CreatureSlot } from '../../game/systems/game-board.system';
import { assert, isDefined } from '@game/shared';
import type { SelectedTarget } from '../../game/systems/interaction.system';
import { Hero } from './hero.entity';
import { PLAYER_EVENTS } from '../../player/player-enums';

export type SerializedEvolution = SerializedCard & {
  atk: number;
  maxHp: number;
  job: string;
  manaCost: number;
};
const makeInterceptors = () => ({
  canAttack: new Interceptable<boolean, { target: Defender }>(),
  canBlock: new Interceptable<boolean, { attacker: Attacker }>(),
  canBeAttackTarget: new Interceptable<boolean, { attacker: Attacker }>(),
  canBeBlocked: new Interceptable<boolean, { defender: Defender }>(),
  canUseAbility: new Interceptable<boolean>(),

  manaCost: new Interceptable<number>(),
  maxHp: new Interceptable<number>(),
  atk: new Interceptable<number>(),

  damageDealt: new Interceptable<number, { target: Defender }>(),
  damageReceived: new Interceptable<
    number,
    { amount: number; source: AnyCard; damage: Damage<AnyCard> }
  >()
});
type EvolutionInterceptors = ReturnType<typeof makeInterceptors>;

export class Evolution extends Card<
  SerializedEvolution,
  EvolutionEventMap,
  EvolutionInterceptors,
  EvolutionBlueprint
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
    this.on('ADD_INTERCEPTOR', event => {
      if (event.data.key === 'maxHp') {
        this.checkHp({ source: this });
      }
    });
  }

  get loyalty() {
    return this.blueprint.loyalty;
  }

  get loyaltyCost() {
    if (this.faction?.equals(this.player.hero.faction)) {
      return 0;
    } else {
      return 1 + this.loyalty;
    }
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

  get isDead() {
    return this.health.isDead;
  }

  private checkHp({ source }: { source: AnyCard }) {
    if (this.isDead) {
      this.destroy(source);
    }
  }

  destroy(source: AnyCard) {
    this.emitter.emit(EVOLUTION_EVENTS.BEFORE_DESTROYED, new DestroyedEvent({ source }));
    this.player.boardSide.remove(this);
    this.emitter.emit(EVOLUTION_EVENTS.AFTER_DESTROYED, new DestroyedEvent({ source }));
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

  declareAttack(target: Defender) {
    assert(!this._isExhausted, 'Creature is exhausted');
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

    this.emitter.emit(EVOLUTION_EVENTS.BEFORE_ATTACK, new AttackEvent({ target }));
    if (isBlocked) {
      assert(!(target instanceof Hero), 'Hero cannot block');
      target.block(this, () => {
        this.dealDamage(target);
      });
    } else {
      this.dealDamage(target);
    }
    this.emitter.emit(EVOLUTION_EVENTS.AFTER_ATTACK, new AttackEvent({ target }));
  }

  block(attacker: Attacker, cb: () => void) {
    this.emitter.emit(EVOLUTION_EVENTS.BEFORE_BLOCK, new BlockEvent({ attacker }));
    cb();
    this.emitter.emit(EVOLUTION_EVENTS.AFTER_BLOCK, new BlockEvent({ attacker }));
  }

  dealDamage(target: Defender) {
    this.emitter.emit(
      EVOLUTION_EVENTS.BEFORE_DEAL_DAMAGE,
      new BeforeDealDamageEvent({ target })
    );
    const damage = new CombatDamage({
      baseAmount: this.atk,
      source: this
    });
    target.receiveDamage(damage);
    this.emitter.emit(
      EVOLUTION_EVENTS.AFTER_DEAL_DAMAGE,
      new AfterDealDamageEvent({ target, damage })
    );
  }

  receiveDamage(damage: Damage<AnyCard>) {
    this.emitter.emit(
      EVOLUTION_EVENTS.BEFORE_TAKE_DAMAGE,
      new TakeDamageEvent({ damage, source: damage.source, target: this })
    );
    this.removeHp(damage.getFinalAmount(this), damage.source);
    this.emitter.emit(
      EVOLUTION_EVENTS.AFTER_TAKE_DAMAGE,
      new TakeDamageEvent({ damage, source: damage.source, target: this })
    );
  }

  private addHp(amount: number, source: AnyCard) {
    this.health.remove(amount);
    this.checkHp({ source });
  }

  private removeHp(amount: number, source: AnyCard) {
    this.health.add(amount, this.maxHp);
    this.checkHp({ source });
  }

  private selectTributes(onComplete: (targets: Array<Creature | Evolution>) => void) {
    this.game.interaction.startSelectingTargets<'card'>({
      getNextTarget: targets => {
        if (targets.length === 0) {
          return {
            type: 'card',
            isElligible: card => {
              if (!card.player.equals(this.player)) return false;
              if (!(card instanceof Creature || card instanceof Evolution)) return false;
              if (!card.position) return false;
              return card.job === this.job;
            }
          };
        }

        return {
          type: 'card',
          isElligible: card => {
            if (!card.player.equals(this.player)) return false;
            if (!(card instanceof Creature || card instanceof Evolution)) return false;
            const isInHand = card.player.hand.some(card => card.equals(card));
            if (!card.position || !isInHand) return false;
            const remainingCost =
              this.manaCost -
              targets.reduce(
                (acc, target) => acc + (target.card as Creature | Evolution).manaCost,
                0
              );
            return card.manaCost <= remainingCost;
          }
        };
      },
      canCommit: targets => {
        const totalCost = targets.reduce(
          (acc, target) => acc + (target.card as Creature | Evolution).manaCost,
          0
        );
        return totalCost === this.manaCost;
      },
      onComplete: tributeTargets => {
        onComplete(tributeTargets.map(target => target.card as Creature | Evolution));
      }
    });
  }

  canAttack(target: Defender) {
    return this.interceptors.canAttack.getValue(this._isExhausted, { target });
  }

  canBlock(attacker: Attacker) {
    return this.interceptors.canBlock.getValue(this._isExhausted, { attacker });
  }

  canBeAttackTarget(attacker: Attacker) {
    return this.interceptors.canBeAttackTarget.getValue(true, { attacker });
  }

  canBeBlocked(defender: Defender) {
    return this.interceptors.canBeBlocked.getValue(true, { defender });
  }

  canUseAbility() {
    return this.interceptors.canUseAbility.getValue(this._isExhausted, {});
  }

  play() {
    this.selectTributes(tributeTargets => {
      this.game.interaction.startSelectingTargets<'creatureSlot'>({
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

          this.emitter.emit(EVOLUTION_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
          tributeTargets.forEach(target => {
            this.player.discard(target as DeckCard);
            this.player.boardSide.remove(target as Creature | Evolution);
          });
          this.player.hero.receiveDamage(
            new LoyaltyDamage({ baseAmount: this.loyaltyCost, source: this })
          );
          this.playAt(target.zone, target.slot);
          this.emitter.emit(EVOLUTION_EVENTS.AFTER_PLAY, new CardAfterPlayEvent({}));
        }
      });
    });
  }

  playAt(zone: 'attack' | 'defense', slot: CreatureSlot) {
    this.player.boardSide.summonCreature(this, zone, slot);
    this.blueprint.onPlay(this.game, this);
  }

  private resolveAbility(ability: Ability<Evolution>, targets: SelectedTarget[]) {
    this.player.spendMana(ability.manaCost);
    ability.onResolve(this.game, this, targets);
  }

  addAbilityToChain(index: number) {
    assert(!this.isExhausted, 'Creature is exhausted');
    assert(this.game.effectChainSystem.currentChain, 'No ongoing effect chain');
    const ability = this.blueprint.abilities[index];
    assert(isDefined(ability), 'Ability not found');
    this.game.effectChainSystem.currentChain.addEffect(() => {
      this.selectAbilityTargets(ability, targets => {
        this.resolveAbility(this.blueprint.abilities[index], targets);
      });
    }, this.player);
  }

  selectAbilityTargets(
    ability: Ability<Evolution>,
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

  forwardListeners() {
    Object.values(EVOLUTION_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `card.${eventName}`,
          new GameCardEvent({ card: this, event: event as any }) as any
        );
      });
    });
  }

  serialize(): SerializedEvolution {
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
