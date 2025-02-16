import { assert, StateMachine, transition, type Values } from '@game/shared';
import type { Game } from './game';
import type { Player } from '../player/player.entity';
import type { AnyCard } from '../card/entities/card.entity';

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

export class EffectChain extends StateMachine<EffectChainState, EffectChainEvent> {
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

  private onAddEffect() {
    this.consecutivePasses = 0;
    this.switchTurn();
  }

  private onPass() {
    this.consecutivePasses++;
    if (this.consecutivePasses >= 2) {
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
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.SKIP), 'Effect chain is already started.');
    assert(player.equals(this.currentPlayer), "Not this player's turn.");

    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.SKIP);
  }

  start(initialEffect: Effect, player: Player): void {
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.START), 'Effect chain is alrady started.');
    assert(player.equals(this.currentPlayer), "Not this player's turn.");

    this.effectStack = [initialEffect];
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.START);
  }

  addEffect(effect: Effect, player: Player): void {
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.ADD_EFFECT), 'Effect chain is not active.');
    assert(player.equals(this.currentPlayer), "Not this player's turn.");

    this.effectStack.push(effect);
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.ADD_EFFECT);
  }

  pass(player: Player): void {
    assert(this.can(EFFECT_CHAIN_STATE_EVENTS.PASS), 'Effect chain is not active.');
    assert(player.equals(this.currentPlayer), "Not this player's turn.");

    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.PASS);
  }
}
