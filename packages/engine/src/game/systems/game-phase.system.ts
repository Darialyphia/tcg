import {
  assert,
  StateMachine,
  transition,
  type EmptyObject,
  type Values
} from '@game/shared';
import { System } from '../../system';
import { GAME_EVENTS, GamePhaseChangeEvent } from '../game.events';
import type { Player } from '../../player/player.entity';

export const GAME_PHASES = {
  MULLIGAN: 'mulligan',
  BATTLE: 'battle',
  END: 'end'
} as const;
export type GamePhase = Values<typeof GAME_PHASES>;

export const GAME_PHASE_TRANSITIONS = {
  START_BATTLE: 'start_battle',
  END_BATTLE: 'end_battle'
} as const;
export type GamePhaseTransition = Values<typeof GAME_PHASE_TRANSITIONS>;

export class GamePhaseSystem extends System<EmptyObject> {
  winner: Player | null = null;

  private stateMachine = new StateMachine<GamePhase, GamePhaseTransition>(
    GAME_PHASES.MULLIGAN,
    [
      transition(
        GAME_PHASES.MULLIGAN,
        GAME_PHASE_TRANSITIONS.START_BATTLE,
        GAME_PHASES.BATTLE
      ),
      transition(GAME_PHASES.BATTLE, GAME_PHASE_TRANSITIONS.END_BATTLE, GAME_PHASES.END)
    ]
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initialize(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  shutdown() {}

  startBattle() {
    assert(
      this.stateMachine.can(GAME_PHASE_TRANSITIONS.START_BATTLE),
      `Cannot enter phase ${GAME_PHASES.BATTLE} from phase ${this.phase}`
    );

    this.game.playerSystem.players.forEach(player => {
      player.mulligan();
    });
    this.stateMachine.dispatch(GAME_PHASE_TRANSITIONS.START_BATTLE);
    this.game.emit(GAME_EVENTS.START_BATTLE, new GamePhaseChangeEvent({}));
    this.game.turnSystem.startGameTurn();
  }

  endBattle(winner: Player) {
    assert(
      this.stateMachine.can(GAME_PHASE_TRANSITIONS.END_BATTLE),
      `Cannot enter phase ${GAME_PHASES.END} from phase ${this.phase}`
    );

    this.stateMachine.dispatch(GAME_PHASE_TRANSITIONS.END_BATTLE);
    this.winner = winner;
    this.game.emit(GAME_EVENTS.END_BATTLE, new GamePhaseChangeEvent({}));
  }

  get phase() {
    return this.stateMachine.getState();
  }
}
