import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { SpellBlueprint } from '../card-blueprint';
import { Interceptable } from '../../utils/interceptable';
import { CardBeforePlayEvent, DestroyedEvent, type SpellEventMap } from '../card.events';
import type { Game } from '../../game/game';
import type { Player } from '../../player/player.entity';
import { SPELL_EVENTS, SPELL_KINDS, type SpellKind } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import {
  IllegalTargetError,
  INTERACTION_STATES,
  type SelectedTarget
} from '../../game/systems/interaction.system';
import { assert } from '@game/shared';
import { LoyaltyDamage } from '../../combat/damage';
import { NotEnoughManaError } from '../card-errors';
import { match } from 'ts-pattern';

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

  get manaCost() {
    return this.interceptors.manaCost.getValue(this.blueprint.manaCost, {});
  }

  get spellKind() {
    return this.blueprint.spellKind;
  }

  private doPlay(targets: SelectedTarget[]) {
    this.emitter.emit(SPELL_EVENTS.BEFORE_PLAY, new CardBeforePlayEvent({}));
    this.player.spendMana(this.manaCost);
    this.player.hero.receiveDamage(
      new LoyaltyDamage({ baseAmount: this.loyaltyCost, source: this })
    );
    match(this.spellKind)
      .with(SPELL_KINDS.CAST, SPELL_KINDS.BURST, () => {
        this.player.sendToDiscardPile(this);
      })
      .with(SPELL_KINDS.COLUMN_ENCHANT, () => {
        const [location] = targets;
        assert(location.type === 'column', new IllegalTargetError());
        this.game.board.columnEnchants[location.slot].push(this);
      })
      .with(SPELL_KINDS.HERO_ENCHANT, () => {
        this.player.boardSide.placeHeroEnchant(this);
      })
      .with(SPELL_KINDS.ROW_ENCHANT, () => {
        const [location] = targets;
        assert(location.type === 'row', new IllegalTargetError());
        location.player.boardSide.placeRowEnchant(location.zone, this);
      })
      .with(SPELL_KINDS.CREATURE_ENCHANT, () => {
        const [target] = targets;
        assert(target.type === 'card', new IllegalTargetError());
      })
      .exhaustive();
    this.blueprint.onPlay(this.game, this, targets);
    this.emitter.emit(SPELL_EVENTS.AFTER_PLAY, new CardBeforePlayEvent({}));
  }

  selectTargets(onComplete: (targets: SelectedTarget[]) => void) {
    this.game.interaction.startSelectingTargets({
      getNextTarget: targets => {
        return this.blueprint.followup.targets[targets.length] ?? null;
      },
      canCommit: this.blueprint.followup.canCommit,
      onComplete
    });
  }

  get hasEnoughMana() {
    return this.manaCost <= this.player.mana;
  }

  play() {
    assert(this.hasEnoughMana, new NotEnoughManaError());
    this.selectTargets(targets => {
      if (this.game.effectChainSystem.currentChain) {
        this.addToChain();
      } else if (
        this.game.interaction.context.state === INTERACTION_STATES.RESPOND_TO_ATTACK
      ) {
        this.game.interaction.startChain(
          {
            source: this,
            handler: () => {
              this.doPlay(targets);
            }
          },
          this.player
        );
      } else {
        this.game.effectChainSystem.createChain(this.player, () => {});
        this.game.effectChainSystem.start(
          {
            source: this,
            handler: () => {
              this.doPlay(targets);
            }
          },
          this.player
        );
      }
    });
  }

  addToChain(targets: SelectedTarget[] = []) {
    assert(this.game.effectChainSystem.currentChain, 'No ongoing effect chain');
    assert(
      this.spellKind === SPELL_KINDS.BURST,
      'Only Burst spells can be added to the chain'
    );
    const chain = this.game.effectChainSystem.currentChain;
    chain.addEffect(
      {
        source: this,
        handler: () => {
          this.doPlay(targets);
        }
      },
      this.player
    );
  }

  get canDestroy() {
    const destructibleKinds: SpellKind[] = [
      SPELL_KINDS.COLUMN_ENCHANT,
      SPELL_KINDS.ROW_ENCHANT,
      SPELL_KINDS.HERO_ENCHANT,
      SPELL_KINDS.CREATURE_ENCHANT
    ];
    return destructibleKinds.includes(this.spellKind);
  }

  destroy(source: AnyCard) {
    assert(this.canDestroy, 'This spell cannot be destroyed');
    this.emitter.emit(SPELL_EVENTS.BEFORE_DESTROYED, new DestroyedEvent({ source }));
    this.player.boardSide.remove(this);
    this.emitter.emit(SPELL_EVENTS.AFTER_DESTROYED, new DestroyedEvent({ source }));
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
