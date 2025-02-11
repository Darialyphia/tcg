import { Card, type CardOptions, type SerializedCard } from './card.entity';
import type { SpellBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import type { SpellEventMap } from '../card.events';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { SPELL_EVENTS, type SpellKind } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';

export type SerializedSpell = SerializedCard & {
  spellKind: SpellKind;
  manacost: number;
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
    this.forwardListeners();
  }

  get manaCost() {
    return this.interceptors.manaCost.getValue(this.blueprint.manaCost, {});
  }

  get spellKind() {
    return this.blueprint.spellKind;
  }

  play() {}

  forwardListeners() {
    Object.values(SPELL_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `card.${eventName}`,
          new GameCardEvent({ card: this, event: event as any }) as any
        );
      });
    });
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      imageId: this.imageId,
      description: this.description,
      set: this.set,
      faction: this.faction?.serialize() ?? null,
      kind: this.kind,
      rarity: this.rarity,
      spellKind: this.spellKind,
      manacost: this.manaCost
    };
  }
}
