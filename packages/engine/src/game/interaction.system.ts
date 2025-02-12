import {
  type EmptyObject,
  type Values,
  assert,
  StateMachine,
  transition
} from '@game/shared';
import { System } from '../system';
import type { AnyCard } from '../card/entities/card.entity';
import type { Player } from '../player/player.entity';
import type { CreatureSlot } from './game-board.system';

export const INTERACTION_STATES = {
  IDLE: 'idle',
  SELECTING_CARD_TARGETS: 'selecting-card-targets',
  SELECTING_CARDS: 'selecting-cards',
  SEARCHING_DECK: 'searching-deck'
} as const;
export type InteractionState = Values<typeof INTERACTION_STATES>;

export const INTERACTION_STATE_TRANSITIONS = {
  START_SELECTING_TARGETS: 'start_selecting_targets',
  COMMIT_TARGETS: 'commit_targets',
  START_SELECTING_CARD: 'start-selecting-card',
  COMMIT_CARD_SELECTION: 'commit-card-selection',
  START_SEARCHING_DECK: 'start-searching-deck',
  COMMIT_SEARCHING_DECK: 'commit-searching-deck'
} as const;
export type Interactiontransition = Values<typeof INTERACTION_STATE_TRANSITIONS>;

type EffectTarget =
  | {
      type: 'card';
      isElligible: (card: AnyCard) => boolean;
    }
  | {
      type: 'creatureSlot';
      isElligible: (opts: { zone: 'attack' | 'defense'; slot: CreatureSlot }) => boolean;
    };

type SelectedTarget =
  | {
      type: 'card';
      card: AnyCard;
    }
  | { type: 'creatureSlot'; slot: CreatureSlot; zone: 'attack' | 'defense' };

export type InteractionStateContext =
  | {
      state: 'idle';
      ctx: EmptyObject;
    }
  | {
      state: 'selecting-card-targets';
      ctx: {
        minTargetCount: number;
        targets: EffectTarget[];
        selectedTargets: SelectedTarget[];
        onComplete: (targets: SelectedTarget[]) => void;
      };
    }
  | {
      state: 'selecting-cards';
      ctx: {
        choices: AnyCard[];
        minChoices: number;
        maxChoices: number;
        onComplete: (selectedCards: AnyCard[]) => void;
      };
    }
  | {
      state: 'searching-deck';
      ctx: {
        player: Player;
        minChoices: number;
        maxChoices: number;
        onComplete: (selectedCards: AnyCard[], player: Player) => void;
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
      )
    ]
  );

  private _context: InteractionStateContext = {
    state: 'idle',
    ctx: {}
  };

  initialize(): void {}

  shutdown(): void {}

  get context() {
    return this._context;
  }

  startSelectingTargets(
    targets: EffectTarget[],
    minTargetCount: number,
    onComplete: (targets: SelectedTarget[]) => void
  ) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.START_SELECTING_TARGETS),
      'Cannot play card'
    );

    this._context = {
      state: 'selecting-card-targets',
      ctx: {
        targets,
        minTargetCount,
        selectedTargets: [],
        onComplete
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

    if (this._context.ctx.selectedTargets.length === this._context.ctx.minTargetCount) {
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
}
