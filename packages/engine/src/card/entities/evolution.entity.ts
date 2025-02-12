import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { Ability, EvolutionBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import {
  CardAfterPlayEvent,
  CardBeforePlayEvent,
  type EvolutionEventMap
} from '../card.events';
import type { Defender, Attacker, Damage } from '../../combat/damage';
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

          tributeTargets.forEach(target => {
            this.player.discard(target as DeckCard);
            this.player.boardSide.remove(target as Creature | Evolution);
          });
          this.emitter.emit(EVOLUTION_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
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

  useAbility(index: number, targets?: SelectedTarget[]) {
    const ability = this.blueprint.abilities[index];
    assert(isDefined(ability), 'Ability not found');
    if (targets) {
      this.resolveAbility(ability, targets);
    } else {
      this.game.interaction.startSelectingTargets({
        getNextTarget: targets => ability.followup.targets[targets.length] ?? null,
        canCommit: ability.followup.canCommit,
        onComplete: targets => {
          this.resolveAbility(ability, targets);
        }
      });
    }
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
