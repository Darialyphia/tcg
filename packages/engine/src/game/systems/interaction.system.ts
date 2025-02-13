import {
  type EmptyObject,
  type Nullable,
  type Values,
  assert,
  StateMachine,
  transition
} from '@game/shared';
import type { CreatureSlot } from './game-board.system';
import type { AnyCard } from '../../card/entities/card.entity';
import type { Player } from '../../player/player.entity';
import { System } from '../../system';
import type { Evolution } from '../../card/entities/evolution.entity';
import type { Creature } from '../../card/entities/creature.entity';
import type { Hero } from '../../card/entities/hero.entity';
import type { Effect } from '../effect-chain';
import type { Attacker, Blocker, Defender } from '../../combat/damage';

export const INTERACTION_STATES = {
  IDLE: 'idle',
  SELECTING_CARD_TARGETS: 'selecting-card-targets',
  SELECTING_CARDS: 'selecting-cards',
  SEARCHING_DECK: 'searching-deck',
  RESPOND_TO_ATTACK: 'respond-to-attack'
} as const;
export type InteractionState = Values<typeof INTERACTION_STATES>;

export const INTERACTION_STATE_TRANSITIONS = {
  START_SELECTING_TARGETS: 'start_selecting_targets',
  COMMIT_TARGETS: 'commit_targets',
  START_SELECTING_CARD: 'start-selecting-card',
  COMMIT_CARD_SELECTION: 'commit-card-selection',
  START_SEARCHING_DECK: 'start-searching-deck',
  COMMIT_SEARCHING_DECK: 'commit-searching-deck',
  DECLARE_ATTACK: 'declare-attack',
  DECLARE_BLOCKER: 'declare-blocker',
  START_CHAIN: 'start-chain',
  SKIP_ATTACK_RESPONSE: 'skip-attack-response',
  COMBAT_RESOLVED: 'combat-resolved'
} as const;
export type Interactiontransition = Values<typeof INTERACTION_STATE_TRANSITIONS>;

export type EffectTarget =
  | {
      type: 'card';
      isElligible: (card: AnyCard) => boolean;
    }
  | {
      type: 'creatureSlot';
      isElligible: (opts: { zone: 'attack' | 'defense'; slot: CreatureSlot }) => boolean;
    };

export type SelectedTarget =
  | {
      type: 'card';
      card: AnyCard;
    }
  | { type: 'creatureSlot'; slot: CreatureSlot; zone: 'attack' | 'defense' };

export type InteractionStateContext =
  | {
      state: typeof INTERACTION_STATES.IDLE;
      ctx: EmptyObject;
    }
  | {
      state: typeof INTERACTION_STATES.SELECTING_CARD_TARGETS;
      ctx: {
        canCommit: (targets: SelectedTarget[]) => boolean;
        getNextTarget: (targets: SelectedTarget[]) => EffectTarget | null;
        selectedTargets: SelectedTarget[];
        onComplete: (targets: SelectedTarget[]) => void;
      };
    }
  | {
      state: typeof INTERACTION_STATES.SELECTING_CARDS;
      ctx: {
        choices: AnyCard[];
        minChoices: number;
        maxChoices: number;
        onComplete: (selectedCards: AnyCard[]) => void;
      };
    }
  | {
      state: typeof INTERACTION_STATES.SEARCHING_DECK;
      ctx: {
        player: Player;
        minChoices: number;
        maxChoices: number;
        onComplete: (selectedCards: AnyCard[], player: Player) => void;
      };
    }
  | {
      state: typeof INTERACTION_STATES.RESPOND_TO_ATTACK;
      ctx: {
        attacker: Attacker;
        target: Defender;
        blocker: Nullable<Blocker>;
      };
    };

export class InteractionSystem extends System<never> {
  private stateMachine = new StateMachine<InteractionState, Interactiontransition>(
    INTERACTION_STATES.IDLE,
    [
      transition(
        INTERACTION_STATES.IDLE,
        INTERACTION_STATE_TRANSITIONS.START_SELECTING_TARGETS,
        INTERACTION_STATES.SELECTING_CARD_TARGETS
      ),
      transition(
        INTERACTION_STATES.SELECTING_CARD_TARGETS,
        INTERACTION_STATE_TRANSITIONS.COMMIT_TARGETS,
        INTERACTION_STATES.IDLE
      ),
      transition(
        INTERACTION_STATES.IDLE,
        INTERACTION_STATE_TRANSITIONS.START_SELECTING_CARD,
        INTERACTION_STATES.SELECTING_CARDS
      ),
      transition(
        INTERACTION_STATES.SELECTING_CARDS,
        INTERACTION_STATE_TRANSITIONS.COMMIT_CARD_SELECTION,
        INTERACTION_STATES.IDLE
      ),
      transition(
        INTERACTION_STATES.IDLE,
        INTERACTION_STATE_TRANSITIONS.START_SEARCHING_DECK,
        INTERACTION_STATES.SEARCHING_DECK
      ),
      transition(
        INTERACTION_STATES.SEARCHING_DECK,
        INTERACTION_STATE_TRANSITIONS.COMMIT_SEARCHING_DECK,
        INTERACTION_STATES.IDLE
      ),
      transition(
        INTERACTION_STATES.IDLE,
        INTERACTION_STATE_TRANSITIONS.DECLARE_ATTACK,
        INTERACTION_STATES.RESPOND_TO_ATTACK
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_ATTACK,
        INTERACTION_STATE_TRANSITIONS.DECLARE_BLOCKER,
        INTERACTION_STATES.RESPOND_TO_ATTACK
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_ATTACK,
        INTERACTION_STATE_TRANSITIONS.START_CHAIN,
        INTERACTION_STATES.RESPOND_TO_ATTACK
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_ATTACK,
        INTERACTION_STATE_TRANSITIONS.COMBAT_RESOLVED,
        INTERACTION_STATES.IDLE
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_ATTACK,
        INTERACTION_STATE_TRANSITIONS.SKIP_ATTACK_RESPONSE,
        INTERACTION_STATES.IDLE
      )
    ]
  );

  private _context: InteractionStateContext = {
    state: 'idle',
    ctx: {}
  };

  private assertStateCtx(state: InteractionStateContext['state']) {
    assert(this._context.state === state, 'Invalid interaction state context');
  }

  initialize(): void {}

  shutdown(): void {}

  get context() {
    return this._context;
  }

  startSelectingTargets<T extends EffectTarget['type'] = EffectTarget['type']>({
    getNextTarget,
    canCommit,
    onComplete
  }: {
    getNextTarget: (targets: Array<SelectedTarget & { type: T }>) => EffectTarget | null;
    canCommit: (targets: Array<SelectedTarget & { type: T }>) => boolean;
    onComplete: (targets: Array<SelectedTarget & { type: T }>) => void;
  }) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.START_SELECTING_TARGETS),
      'Cannot play card'
    );

    this._context = {
      state: 'selecting-card-targets',
      ctx: {
        getNextTarget: getNextTarget as (
          targets: SelectedTarget[]
        ) => EffectTarget | null,
        selectedTargets: [],
        canCommit: canCommit as (targets: SelectedTarget[]) => boolean,
        onComplete: onComplete as (targets: SelectedTarget[]) => void
      }
    };
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.START_SELECTING_TARGETS);
    this.checkCardTargets();
  }

  addCardTarget(target: SelectedTarget) {
    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARD_TARGETS,
      'Cannot add card target'
    );

    this._context.ctx.selectedTargets.push(target);
    this.checkCardTargets();
  }

  private checkCardTargets() {
    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARD_TARGETS,
      'Invalid state'
    );

    if (this._context.ctx.getNextTarget(this._context.ctx.selectedTargets)) {
      this.commitTargets();
    }
  }

  commitTargets() {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.COMMIT_TARGETS),
      'Cannot commit playing card'
    );
    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARD_TARGETS,
      'Invalid interaction state context'
    );
    assert(
      this._context.ctx.canCommit(this._context.ctx.selectedTargets),
      'Cannot commit targets'
    );

    const { selectedTargets, onComplete } = this._context.ctx;
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.COMMIT_TARGETS);
    this._context = {
      state: 'idle',
      ctx: {}
    };
    onComplete(selectedTargets);
  }

  startSelectingCards({
    choices,
    onComplete,
    minChoices,
    maxChoices
  }: {
    choices: AnyCard[];
    onComplete: (selectedCards: AnyCard[]) => void;
    minChoices: number;
    maxChoices: number;
  }) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.START_SELECTING_CARD),
      'Cannot start selecting cards'
    );
    this._context = {
      state: 'selecting-cards',
      ctx: { choices, onComplete, minChoices, maxChoices }
    };
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.START_SELECTING_CARD);
  }

  commitCardSelection(selectedCardIds: string[]) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.COMMIT_CARD_SELECTION),
      'Cannot commit card selection'
    );

    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARDS,
      'Invalid interaction state context'
    );

    assert(
      selectedCardIds.length >= this._context.ctx.minChoices,
      'Not enough cards selected'
    );
    assert(
      selectedCardIds.length <= this._context.ctx.maxChoices,
      'Too many cards selected'
    );

    const selectedCards = this._context.ctx.choices.filter(card =>
      selectedCardIds.includes(card.id)
    );
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.COMMIT_CARD_SELECTION);
    this._context.ctx.onComplete(selectedCards);
    this._context = {
      state: 'idle',
      ctx: {}
    };
  }

  startSearchingDeck({
    player,
    minChoices,
    maxChoices,
    onComplete
  }: {
    player: Player;
    minChoices: number;
    maxChoices: number;
    onComplete: (selectedCards: AnyCard[], player: Player) => void;
  }) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.START_SEARCHING_DECK),
      'Cannot start searching deck'
    );
    this._context = {
      state: 'searching-deck',
      ctx: { player, minChoices, maxChoices, onComplete }
    };

    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.START_SEARCHING_DECK);
  }

  commitSearchingDeck(selectedCardIds: string[]) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.COMMIT_SEARCHING_DECK),
      'Cannot commit searching deck'
    );

    assert(
      this._context.state === INTERACTION_STATES.SEARCHING_DECK,
      'Invalid interaction state context'
    );

    assert(
      selectedCardIds.length >= this._context.ctx.minChoices,
      'Not enough cards selected'
    );

    assert(
      selectedCardIds.length <= this._context.ctx.maxChoices,
      'Too many cards selected'
    );

    const selectedCards = this._context.ctx.player.deck.cards.filter(card =>
      selectedCardIds.includes(card.id)
    );
    this._context.ctx.onComplete(selectedCards, this._context.ctx.player);
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.COMMIT_SEARCHING_DECK);
    this._context = {
      state: 'idle',
      ctx: {}
    };
  }

  declareAttack(attacker: Attacker, target: Defender) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.DECLARE_ATTACK),
      'Cannot declare attack'
    );

    this._context = {
      state: 'respond-to-attack',
      ctx: { attacker, target, blocker: null }
    };

    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.DECLARE_ATTACK);
  }

  declareBlocker(blocker: Blocker) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.DECLARE_BLOCKER),
      'Cannot declare blocker'
    );

    assert(
      this._context.state === INTERACTION_STATES.RESPOND_TO_ATTACK,
      'Invalid interaction state context'
    );

    assert(
      !this.game.effectChainSystem.currentChain,
      'Cannot declare blocker after a chain has been started'
    );

    assert(
      !blocker.player.equals(this._context.ctx.target.player),
      'Attacking player cannot declare blocker'
    );

    this._context.ctx.blocker = blocker;
  }

  startChain(effect: Effect, player: Player) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.START_CHAIN),
      'Cannot start chain'
    );

    assert(
      this._context.state === INTERACTION_STATES.RESPOND_TO_ATTACK,
      'Invalid interaction state context'
    );

    assert(
      !player.equals(this._context.ctx.target.player),
      'Attacking player cannot declare blocker'
    );

    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.START_CHAIN);
    this.game.effectChainSystem.createChain(player, this.resolveCombat.bind(this));
    this.game.effectChainSystem.start(effect, player);
  }

  skipAttackResponse(player: Player) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.SKIP_ATTACK_RESPONSE),
      'Cannot skip attack response'
    );

    assert(
      this._context.state === INTERACTION_STATES.RESPOND_TO_ATTACK,
      'Invalid interaction state context'
    );

    assert(
      !player.equals(this._context.ctx.target.player),
      'Attacking player cannot skip response'
    );
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.SKIP_ATTACK_RESPONSE);
  }

  private resolveCombat() {
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.COMBAT_RESOLVED);
    assert(
      this._context.state === INTERACTION_STATES.RESPOND_TO_ATTACK,
      'Invalid interaction state context'
    );

    const { attacker, target, blocker } = this._context.ctx;

    if (blocker) {
      attacker.attack(blocker, true);
    } else {
      attacker.attack(target, false);
    }

    this._context = {
      state: 'idle',
      ctx: {}
    };
    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.COMBAT_RESOLVED);
  }
}
