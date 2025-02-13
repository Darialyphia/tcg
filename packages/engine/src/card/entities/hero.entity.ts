import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { Ability, HeroBlueprint } from '../card-blueprint';
import type { HeroEventMap } from '../card.events';
import type { Attacker, Damage } from '../../combat/damage';
import { Interceptable } from '../../utils/interceptable';
import type { Player } from '../../player/player.entity';
import type { Game } from '../../game/game';
import { HealthComponent } from '../../combat/health.component';
import { HERO_EVENTS } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import { assert, isDefined } from '@game/shared';
import type { SelectedTarget } from '../../game/systems/interaction.system';

export type SerializedHero = SerializedCard & {
  maxHp: number;
};

const makeInterceptors = () => ({
  maxHp: new Interceptable<number>(),

  canBeAttackTarget: new Interceptable<boolean, { attacker: Attacker }>(),

  damageReceived: new Interceptable<
    number,
    { amount: number; source: AnyCard; damage: Damage<AnyCard> }
  >()
});
type HeroInterceptors = ReturnType<typeof makeInterceptors>;

export class Hero extends Card<
  SerializedHero,
  HeroEventMap,
  HeroInterceptors,
  HeroBlueprint
> {
  readonly health: HealthComponent;
  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
    this.health = new HealthComponent({
      initialValue: this.maxHp
    });
    this.forwardListeners();
  }

  get maxHp(): number {
    return this.interceptors.maxHp.getValue(this.blueprint.maxHp, {});
  }

  get isDead() {
    return this.health.isDead;
  }

  getReceivedDamage<T extends AnyCard>(amount: number, damage: Damage<T>, from: AnyCard) {
    return this.interceptors.damageReceived.getValue(amount, {
      source: from,
      damage,
      amount
    });
  }

  private resolveAbility(ability: Ability<Hero>, targets: SelectedTarget[]) {
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

  receiveDamage(damage: Damage<AnyCard>) {
    this.health.remove(damage.getFinalAmount(this));
  }

  play() {}

  forwardListeners() {
    Object.values(HERO_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `card.${eventName}`,
          new GameCardEvent({ card: this, event: event as any }) as any
        );
      });
    });
  }

  serialize(): SerializedHero {
    return {
      id: this.id,
      name: this.name,
      imageId: this.imageId,
      description: this.description,
      kind: this.kind,
      maxHp: this.maxHp,
      rarity: this.rarity,
      faction: this.faction?.serialize() ?? null,
      set: this.set.serialize()
    };
  }
}
