import {
  assert,
  StateMachine,
  transition,
  type Serializable,
  type Values
} from '@game/shared';
import type { Game } from './game';
import type { Player } from '../player/player.entity';
import type { AnyCard, SerializedCard } from '../card/entities/card.entity';

const EFFECT_CHAIN_STATES = {
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  RESOLVING: 'RESOLVING',
  FINISHED: 'FINISHED'
} as const;
type EffectChainState = Values<typeof EFFECT_CHAIN_STATES>;

const EFFECT_CHAIN_STATE_EVENTS = {
  SKIP: 'SKIP',
  START: 'START',
  ADD_EFFECT: 'ADD_EFFECT',
  PASS: 'PASS',
  RESOLVE: 'RESOLVE',
  END: 'END'
} as const;
type EffectChainEvent = Values<typeof EFFECT_CHAIN_STATE_EVENTS>;

export type Effect = { source: AnyCard; handler: (game: Game) => void };

export type SerializedEffectChain = SerializedCard[];

export class EffectChain
  extends StateMachine<EffectChainState, EffectChainEvent>
  implements Serializable<SerializedEffectChain>
{
  private effectStack: Effect[] = [];
  private consecutivePasses = 0;
  private currentPlayer: Player;

  constructor(
    private game: Game,
    startingPlayer: Player,
    public onResolved: () => void
  ) {
    super(EFFECT_CHAIN_STATES.IDLE);
    this.currentPlayer = startingPlayer;

    this.addTransitions([
      transition(
        EFFECT_CHAIN_STATES.IDLE,
        EFFECT_CHAIN_STATE_EVENTS.SKIP,
        EFFECT_CHAIN_STATES.FINISHED,
        this.onEnd.bind(this)
      ),
      transition(
        EFFECT_CHAIN_STATES.IDLE,
        EFFECT_CHAIN_STATE_EVENTS.START,
        EFFECT_CHAIN_STATES.ACTIVE,
        this.onAddEffect.bind(this)
      ),
      transition(
        EFFECT_CHAIN_STATES.ACTIVE,
        EFFECT_CHAIN_STATE_EVENTS.ADD_EFFECT,
        EFFECT_CHAIN_STATES.ACTIVE,
        this.onAddEffect.bind(this)
      ),
      transition(
        EFFECT_CHAIN_STATES.ACTIVE,
        EFFECT_CHAIN_STATE_EVENTS.PASS,
        EFFECT_CHAIN_STATES.ACTIVE,
        this.onPass.bind(this)
      ),
      transition(
        EFFECT_CHAIN_STATES.ACTIVE,
        EFFECT_CHAIN_STATE_EVENTS.RESOLVE,
        EFFECT_CHAIN_STATES.RESOLVING,
        this.resolveEffects.bind(this)
      ),
      transition(
        EFFECT_CHAIN_STATES.RESOLVING,
        EFFECT_CHAIN_STATE_EVENTS.END,
        EFFECT_CHAIN_STATES.FINISHED,
        this.onEnd.bind(this)
      )
    ]);
  }

  get size() {
    return this.effectStack.length;
  }

  private onAddEffect() {
    this.consecutivePasses = 0;
    this.switchTurn();
  }

  private onPass() {
    this.consecutivePasses++;
    if (
      this.consecutivePasses >= 2 ||
      (this.effectStack.length <= 1 && this.consecutivePasses >= 1)
    ) {
      this.dispatch(EFFECT_CHAIN_STATE_EVENTS.RESOLVE);
    } else {
      this.switchTurn();
    }
  }

  private onEnd() {
    this.onResolved();
  }

  private resolveEffects(): void {
    while (this.effectStack.length > 0) {
      const effect = this.effectStack.pop();
      if (effect) effect.handler(this.game);
    }
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.END);
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer.opponent;
  }

  cancel(player: Player) {
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.SKIP), new ChainAlreadyStartedError());
    assert(player.equals(this.currentPlayer), new IllegalPlayerResponseError());

    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.SKIP);
  }

  start(initialEffect: Effect, player: Player): void {
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.START), new ChainAlreadyStartedError());
    assert(player.equals(this.currentPlayer), new IllegalPlayerResponseError());

    this.effectStack = [initialEffect];
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.START);
  }

  addEffect(effect: Effect, player: Player): void {
    assert(
      this.can(EFFECT_CHAIN_STATE_EVENTS.ADD_EFFECT),
      new InactiveEffectChainError()
    );
    assert(player.equals(this.currentPlayer), new IllegalPlayerResponseError());

    this.effectStack.push(effect);
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.ADD_EFFECT);
  }

  pass(player: Player): void {
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.PASS), new InactiveEffectChainError());
    assert(player.equals(this.currentPlayer), new IllegalPlayerResponseError());

    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.PASS);
  }

  serialize() {
    return this.effectStack.map(effect => effect.source.serialize());
  }
}

export class IllegalPlayerResponseError extends Error {
  constructor() {
    super('Illegal player response');
  }
}

export class ChainAlreadyStartedError extends Error {
  constructor() {
    super('Effect chain is already started');
  }
}

export class InactiveEffectChainError extends Error {
  constructor() {
    super('No effect chain is currently active');
  }
}
