import { Card, type CardOptions } from './card.entity';
import type { SpellBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import type { SpellEventMap } from '../card.events';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';

export type SerializedSpell = {
  id: string;
};

const makeInterceptors = () => ({
  manaCost: new Interceptable<number>()
});

type SpellInterceptors = ReturnType<typeof makeInterceptors>;

export class Spell extends Card<
  SerializedSpell,
  SpellEventMap,
  SpellInterceptors,
  SpellBlueprint
> {
  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
  }

  get manaCost() {
    return this.interceptors.manaCost.getValue(this.blueprint.manaCost, {});
  }

  get spellKind() {
    return this.blueprint.spellKind;
  }

  play() {}

  serialize() {
    return {
      id: this.id
    };
  }
}
