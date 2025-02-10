import { Card, type AnyCard, type CardOptions } from './card.entity';
import type { HeroBlueprint } from '../card-blueprint';
import type { HeroEventMap } from '../card.events';
import type { Attacker, Damage, Defender } from '../../utils/damage';
import { Interceptable } from '../../utils/interceptable';
import type { Player } from '../../player/player.entity';
import type { Game } from '../../game/game';

export type SerializedHero = {
  id: string;
};

const makeInterceptors = () => ({
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
  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
  }

  getReceivedDamage<T extends AnyCard>(amount: number, damage: Damage<T>, from: AnyCard) {
    return this.interceptors.damageReceived.getValue(amount, {
      source: from,
      damage,
      amount
    });
  }

  play() {}

  serialize() {
    return {
      id: this.id
    };
  }
}
