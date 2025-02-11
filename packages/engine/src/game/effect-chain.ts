import { StateMachine, transition, type Values } from '@game/shared';
import type { Game } from './game';
import type { Player } from '../player/player.entity';

const EFFECT_CHAIN_STATES = {
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  RESOLVING: 'RESOLVING'
} as const;
type EffectChainState = Values<typeof EFFECT_CHAIN_STATES>;

const EFFECT_CHAIN_STATE_EVENTS = {
  START: 'START',
  ADD_EFFECT: 'ADD_EFFECT',
  PASS: 'PASS',
  RESOLVE: 'RESOLVE',
  END: 'END'
} as const;
type EffectChainEvent = Values<typeof EFFECT_CHAIN_STATE_EVENTS>;

type Effect = (game: Game) => void; // Represents an in-game effect

export class EffectChain extends StateMachine<EffectChainState, EffectChainEvent> {
  private effectStack: Effect[] = [];
  private consecutivePasses = 0;
  private currentPlayer: Player;
  onResolved: () => void = () => {};

  constructor(private game: Game) {
    super(EFFECT_CHAIN_STATES.IDLE);
    this.currentPlayer = game.playerSystem.players[0];

    this.addTransitions([
      transition(
        EFFECT_CHAIN_STATES.IDLE,
        EFFECT_CHAIN_STATE_EVENTS.START,
        EFFECT_CHAIN_STATES.ACTIVE
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
        EFFECT_CHAIN_STATES.IDLE,
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
    this.onResolved = () => {};
  }

  /** Starts an effect chain with the first effect */
  startChain(
    initialEffect: Effect,
    startingPlayer: Player,
    onResolved: () => void
  ): void {
    if (!this.can(EFFECT_CHAIN_STATE_EVENTS.START)) {
      throw new Error('Cannot start a new effect chain while another is active.');
    }
    this.effectStack = [initialEffect];
    this.onResolved = onResolved;
    this.currentPlayer = startingPlayer;
    this.consecutivePasses = 0;
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.START);
  }

  addEffect(effect: Effect, player: Player): void {
    if (this.getState() !== EFFECT_CHAIN_STATES.ACTIVE) {
      throw new Error('Effect chain is not active.');
    }
    if (!player.equals(this.currentPlayer)) {
      throw new Error("Not this player's turn.");
    }
    this.effectStack.push(effect);
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.ADD_EFFECT);
  }

  pass(player: Player): void {
    if (!this.can(EFFECT_CHAIN_STATE_EVENTS.PASS)) {
      throw new Error('Effect chain is not active.');
    }
    if (!player.equals(this.currentPlayer)) {
      throw new Error("Not this player's turn.");
    }
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.PASS);
  }

  private resolveEffects(): void {
    while (this.effectStack.length > 0) {
      const effect = this.effectStack.pop();
      if (effect) effect(this.game);
    }
    this.dispatch(EFFECT_CHAIN_STATE_EVENTS.END);
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer.opponent;
  }
}
