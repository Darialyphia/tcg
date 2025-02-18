import {
  type EmptyObject,
  type Nullable,
  type Serializable,
  type Values,
  assert,
  isDefined,
  StateMachine,
  transition
} from '@game/shared';
import type { CreatureSlot } from './game-board.system';
import type { AnyCard, SerializedCard } from '../../card/entities/card.entity';
import type { Player, SerializedPlayer } from '../../player/player.entity';
import { System } from '../../system';
import type { Effect } from '../effect-chain';
import type { Attacker, Blocker, Defender } from '../../combat/damage';
import { match } from 'ts-pattern';
import type { SerializedCreature } from '../../card/entities/creature.entity';
import type { SerializedEvolution } from '../../card/entities/evolution.entity';
import type { SerializedHero } from '../../card/entities/hero.entity';

export const INTERACTION_STATES = {
  IDLE: 'idle',
  SELECTING_CARD_TARGETS: 'selecting-card-targets',
  SELECTING_CARDS: 'selecting-cards',
  SEARCHING_DECK: 'searching-deck',
  RESPOND_TO_ATTACK: 'respond-to-attack',
  RESPOND_TO_END_TURN: 'respond-to-end-turn'
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
  COMBAT_RESOLVED: 'combat-resolved',
  DECLARE_TURN_END: 'declare-turn-end',
  END_TURN: 'end-turn',
  SKIP_END_TURN_RESPONSE: 'skip-end-turn-response'
} as const;
export type Interactiontransition = Values<typeof INTERACTION_STATE_TRANSITIONS>;

export type EffectTarget =
  | {
      type: 'card';
      isElligible: (card: AnyCard) => boolean;
    }
  | {
      type: 'creatureSlot';
      isElligible: (opts: {
        zone: 'attack' | 'defense';
        slot: CreatureSlot;
        playerId: string;
      }) => boolean;
    }
  | {
      type: 'row';
      isElligible: (opts: { zone: 'attack' | 'defense'; playerId: string }) => boolean;
    }
  | {
      type: 'column';
      isElligible: (opts: { slot: CreatureSlot }) => boolean;
    };

export type SerializedTarget =
  | {
      type: 'card';
      card: SerializedCard;
    }
  | {
      type: 'creatureSlot';
      zone: 'attack' | 'defense';
      slot: CreatureSlot;
      playerId: string;
    }
  | {
      type: 'row';
      zone: 'attack' | 'defense';
      playerId: string;
    }
  | {
      type: 'column';
      slot: CreatureSlot;
    };

export type SelectedTarget =
  | {
      type: 'card';
      card: AnyCard;
    }
  | {
      type: 'creatureSlot';
      slot: CreatureSlot;
      zone: 'attack' | 'defense';
      player: Player;
    }
  | { type: 'row'; zone: 'attack' | 'defense'; player: Player }
  | { type: 'column'; slot: CreatureSlot };

export type InteractionStateContext =
  | {
      state: typeof INTERACTION_STATES.IDLE;
      ctx: EmptyObject;
    }
  | {
      state: typeof INTERACTION_STATES.RESPOND_TO_END_TURN;
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

export type SerialiedInteractionStateContext =
  | {
      state: typeof INTERACTION_STATES.IDLE;
      ctx: EmptyObject;
    }
  | {
      state: typeof INTERACTION_STATES.RESPOND_TO_END_TURN;
      ctx: EmptyObject;
    }
  | {
      state: typeof INTERACTION_STATES.SELECTING_CARD_TARGETS;
      ctx: {
        canCommit: boolean;
        elligibleTargets: Array<SerializedTarget>;
        selectedTargets: Array<SerializedTarget>;
      };
    }
  | {
      state: typeof INTERACTION_STATES.SELECTING_CARDS;
      ctx: {
        choices: SerializedCard[];
        minChoices: number;
        maxChoices: number;
      };
    }
  | {
      state: typeof INTERACTION_STATES.SEARCHING_DECK;
      ctx: {
        player: SerializedPlayer;
        minChoices: number;
        maxChoices: number;
      };
    }
  | {
      state: typeof INTERACTION_STATES.RESPOND_TO_ATTACK;
      ctx: {
        attacker: SerializedCreature | SerializedEvolution;
        target: SerializedCreature | SerializedEvolution | SerializedHero;
        blocker: SerializedCreature | SerializedEvolution | null;
      };
    };

export class InteractionSystem
  extends System<never>
  implements Serializable<SerialiedInteractionStateContext>
{
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
      ),
      transition(
        INTERACTION_STATES.IDLE,
        INTERACTION_STATE_TRANSITIONS.DECLARE_TURN_END,
        INTERACTION_STATES.RESPOND_TO_END_TURN
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_END_TURN,
        INTERACTION_STATE_TRANSITIONS.SKIP_END_TURN_RESPONSE,
        INTERACTION_STATES.IDLE
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_END_TURN,
        INTERACTION_STATE_TRANSITIONS.START_CHAIN,
        INTERACTION_STATES.RESPOND_TO_END_TURN
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_END_TURN,
        INTERACTION_STATE_TRANSITIONS.COMBAT_RESOLVED,
        INTERACTION_STATES.IDLE
      ),
      transition(
        INTERACTION_STATES.RESPOND_TO_END_TURN,
        INTERACTION_STATE_TRANSITIONS.END_TURN,
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
    this.commitTargetsIfAble();
  }

  private validateTarget(target: SelectedTarget) {
    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARD_TARGETS,
      'Cannot add card target'
    );
    const nextTarget = this._context.ctx.getNextTarget(this._context.ctx.selectedTargets);
    assert(isDefined(nextTarget), new TooManyTargetsError());
    assert(nextTarget.type === target.type, new IllegalTargetError());

    match(target)
      .with({ type: 'card' }, ({ card }) => {
        assert(nextTarget.isElligible(card as any), new IllegalTargetError());
      })
      .with({ type: 'creatureSlot' }, ({ slot, zone }) => {
        assert(nextTarget.isElligible({ slot, zone } as any), new IllegalTargetError());
      })
      .with({ type: 'row' }, { type: 'column' }, () => {}) // no further validation necessary
      .exhaustive();
  }

  addCardTarget(target: SelectedTarget) {
    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARD_TARGETS,
      'Cannot add card target'
    );
    this.validateTarget(target);
    this._context.ctx.selectedTargets.push(target);
    this.commitTargetsIfAble();
  }

  private commitTargetsIfAble() {
    assert(
      this._context.state === INTERACTION_STATES.SELECTING_CARD_TARGETS,
      'Invalid state'
    );
    const nextTarget = this._context.ctx.getNextTarget(this._context.ctx.selectedTargets);
    if (!isDefined(nextTarget)) {
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
      new IllegalTargetError()
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

    if (this._context.state === INTERACTION_STATES.RESPOND_TO_ATTACK) {
      assert(
        !player.equals(this._context.ctx.target.player),
        'Attacking player cannot declare blocker'
      );

      this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.START_CHAIN);
      this.game.effectChainSystem.createChain(player, this.resolveCombat.bind(this));
      this.game.effectChainSystem.start(effect, player);
    } else if (this._context.state === INTERACTION_STATES.RESPOND_TO_END_TURN) {
      assert(
        !player.equals(this.game.turnSystem.activePlayer),
        'Active player cannot declare blocker'
      );
      this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.START_CHAIN);
      this.game.effectChainSystem.createChain(player, this.endTurn.bind(this));
      this.game.effectChainSystem.start(effect, player);
    } else {
      throw new Error('Invalid interaction state context');
    }
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

  declareTurnEnd() {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.DECLARE_TURN_END),
      'Cannot declare turn end'
    );

    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.DECLARE_TURN_END);
  }

  skipEndTurnResponse(player: Player) {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.SKIP_END_TURN_RESPONSE),
      'Cannot skip end turn response'
    );

    assert(
      this._context.state === INTERACTION_STATES.RESPOND_TO_END_TURN,
      'Invalid interaction state context'
    );

    assert(
      !player.equals(this.game.turnSystem.activePlayer),
      'Cannot skip end turn response'
    );

    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.SKIP_END_TURN_RESPONSE);

    this._context = {
      state: 'idle',
      ctx: {}
    };
  }

  endTurn() {
    assert(
      this.stateMachine.can(INTERACTION_STATE_TRANSITIONS.END_TURN),
      'Cannot end turn'
    );

    this.stateMachine.dispatch(INTERACTION_STATE_TRANSITIONS.END_TURN);

    this._context = {
      state: 'idle',
      ctx: {}
    };

    this.game.turnSystem.activePlayer.endTurn();
  }

  serialize(): SerialiedInteractionStateContext {
    return {
      state: this._context.state,
      ctx: match(this._context)
        .with({ state: 'idle' }, () => ({}))
        .with({ state: 'respond-to-end-turn' }, () => ({}))
        .with({ state: 'selecting-card-targets' }, ({ ctx }) => {
          const nextTarget = ctx.getNextTarget(ctx.selectedTargets);
          return {
            canCommit: ctx.canCommit,
            elligibleTargets: match(nextTarget)
              .with({ type: 'card' }, ({ isElligible }) =>
                this.game.board
                  .getAllCardsInPlay()
                  .filter(card => isElligible(card))
                  .map(card => ({ type: 'card', card: card.serialize() }))
              )
              .with({ type: 'creatureSlot' }, ({ isElligible }) => {
                const result: Array<{
                  type: 'creatureSlot';
                  slot: CreatureSlot;
                  zone: 'attack' | 'defense';
                  playerId: string;
                }> = [];
                this.game.playerSystem.players.forEach(player => {
                  (['attack', 'defense'] as const).forEach(zone => {
                    for (let i = 0; i < 5; i++) {
                      const slot = i as CreatureSlot;
                      const elligible = isElligible({
                        slot,
                        zone,
                        playerId: player.id
                      });
                      if (!elligible) continue;

                      result.push({
                        type: 'creatureSlot',
                        slot,
                        zone,
                        playerId: player.id
                      });
                    }
                  });
                });
                return result;
              })
              .with({ type: 'row' }, ({ isElligible }) => {
                return this.game.playerSystem.players.flatMap(player => {
                  return (['attack', 'defense'] as const).flatMap(zone => {
                    const elligible = isElligible({ zone, playerId: player.id });
                    if (!elligible) return [];
                    return [{ type: 'row', zone, playerId: player.id }];
                  });
                });
              })
              .with({ type: 'column' }, ({ isElligible }) => {
                return ([0, 1, 2, 3, 4] as const)
                  .map(slot => {
                    const elligible = isElligible({ slot });
                    if (!elligible) return null;
                    return { type: 'column', slot };
                  })
                  .filter(isDefined);
              })
              .with(null, () => [])
              .exhaustive(),
            selectedTargets: ctx.selectedTargets.map(target => {
              return match(target)
                .with({ type: 'card' }, ({ card }) => ({
                  type: 'card',
                  card: card.serialize()
                }))
                .with({ type: 'creatureSlot' }, ({ slot, zone, player }) => ({
                  type: 'creatureSlot',
                  slot,
                  zone,
                  playerId: player.id
                }))
                .with({ type: 'row' }, ({ zone, player }) => ({
                  type: 'row',
                  zone,
                  playerId: player.id
                }))
                .with({ type: 'column' }, ({ slot }) => ({ type: 'column', slot }));
            })
          };
        })
        .with({ state: 'selecting-cards' }, ({ ctx }) => ({
          choices: ctx.choices.map(card => card.serialize()),
          minChoices: ctx.minChoices,
          maxChoices: ctx.maxChoices
        }))
        .with({ state: 'searching-deck' }, ({ ctx }) => ({
          player: ctx.player.serialize(),
          minChoices: ctx.minChoices,
          maxChoices: ctx.maxChoices
        }))
        .with({ state: 'respond-to-attack' }, ({ ctx }) => ({
          attacker: ctx.attacker.serialize(),
          target: ctx.target.serialize(),
          blocker: ctx.blocker?.serialize() ?? null
        }))
        .exhaustive()
    } as SerialiedInteractionStateContext;
  }
}

export class TooManyTargetsError extends Error {
  constructor() {
    super('You cannot add more targets');
  }
}

export class InvalidInteractionStateError extends Error {
  constructor() {
    super('Invalid interaction state');
  }
}

export class IllegalTargetError extends Error {
  constructor() {
    super('Illegal target');
  }
}
