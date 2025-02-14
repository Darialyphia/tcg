import { Card, type CardOptions, type SerializedCard } from './card.entity';
import type { SpellBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import { CardBeforePlayEvent, type SpellEventMap } from '../card.events';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { SPELL_EVENTS, SPELL_KINDS, type SpellKind } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import type { SelectedTarget } from '../../game/systems/interaction.system';
import { assert } from '@game/shared';

export type SerializedSpell = SerializedCard & {
  spellKind: SpellKind;
  manaCost: number;
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
    this.blueprint.onInit(this.game, this);
  }

  get manaCost() {
    return this.interceptors.manaCost.getValue(this.blueprint.manaCost, {});
  }

  get spellKind() {
    return this.blueprint.spellKind;
  }

  private doPlay(targets: SelectedTarget[]) {
    this.emitter.emit(SPELL_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
    this.player.spendMana(this.manaCost);
    this.blueprint.onPlay(this.game, this, targets);
    this.emitter.emit(SPELL_EVENTS.AFTER_PLAY, new CardBeforePlayEvent({}));
  }

  selectTargets(onComplete: (targets: SelectedTarget[]) => void) {
    this.game.interaction.startSelectingTargets({
      getNextTarget: targets => this.blueprint.followup.targets[targets.length] ?? null,
      canCommit: this.blueprint.followup.canCommit,
      onComplete
    });
  }

  play() {
    this.selectTargets(targets => {
      this.game.effectChainSystem.createChain(this.player, () => {});
      this.game.effectChainSystem.start(() => {
        this.doPlay(targets);
      }, this.player);
    });
  }

  addToChain() {
    assert(this.game.effectChainSystem.currentChain, 'No ongoing effect chain');
    assert(
      this.spellKind === SPELL_KINDS.BURST,
      'Only Burst spells can be added to the chain'
    );
    const chain = this.game.effectChainSystem.currentChain;
    this.selectTargets(targets => {
      chain.addEffect(() => {
        this.doPlay(targets);
      }, this.player);
    });
  }

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

  serialize(): SerializedSpell {
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
      manaCost: this.manaCost
    };
  }
}
