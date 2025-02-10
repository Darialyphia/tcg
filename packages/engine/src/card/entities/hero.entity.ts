import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { HeroBlueprint } from '../card-blueprint';
import type { HeroEventMap } from '../card.events';
import type { Attacker, Damage } from '../../combat/damage';
import { Interceptable } from '../../utils/interceptable';
import type { Player } from '../../player/player.entity';
import type { Game } from '../../game/game';
import { HealthComponent } from '../../combat/health.component';

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
  }

  get maxHp(): number {
    return this.interceptors.maxHp.getValue(this.blueprint.maxHp, {});
  }

  getReceivedDamage<T extends AnyCard>(amount: number, damage: Damage<T>, from: AnyCard) {
    return this.interceptors.damageReceived.getValue(amount, {
      source: from,
      damage,
      amount
    });
  }

  play() {}

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
