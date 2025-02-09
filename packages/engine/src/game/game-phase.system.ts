import { StateMachine, transition, type EmptyObject, type Values } from '@game/shared';
import { System } from '../system';

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

  get phase() {
    return this.stateMachine.getState();
  }
}
