import type { Values } from '@game/shared';
import type { Player } from '../../player/player.entity';
import { System } from '../../system';
import { TypedEvent, TypedEventEmitter } from '../../utils/typed-emitter';
import { GAME_EVENTS } from '../game.events';

export const TURN_EVENTS = {
  TURN_START: 'turn_start',
  TURN_END: 'turn_end'
} as const;

export type TurnEvent = Values<typeof TURN_EVENTS>;

export class GameTurnEvent extends TypedEvent<
  { turnCount: number },
  { turnCount: number }
> {
  serialize(): { turnCount: number } {
    return {
      turnCount: this.data.turnCount
    };
  }
}

export type TurnEventMap = {
  [TURN_EVENTS.TURN_START]: GameTurnEvent;
  [TURN_EVENTS.TURN_END]: GameTurnEvent;
};
export class TurnSystem extends System<never> {
  private _elapsedTurns = 0;

  private _activePlayer!: Player;

  private firstPlayer!: Player;

  private emitter = new TypedEventEmitter<TurnEventMap>();

  initialize() {
    // const idx = this.game.rngSystem.nextInt(this.game.playerSystem.players.length);
    this._activePlayer = this.game.playerSystem.players[0];
    this.firstPlayer = this._activePlayer;

    this.game.on(GAME_EVENTS.PLAYER_END_TURN, this.onPlayerTurnEnd.bind(this));

    this.on(TURN_EVENTS.TURN_START, e => {
      this.game.emit(GAME_EVENTS.TURN_START, e);
    });
    this.on(TURN_EVENTS.TURN_END, e => {
      this.game.emit(GAME_EVENTS.TURN_END, e);
    });
  }

  shutdown() {
    this.emitter.removeAllListeners();
  }

  get activePlayer() {
    return this._activePlayer;
  }

  get elapsedTurns() {
    return this._elapsedTurns;
  }

  get on() {
    return this.emitter.on.bind(this.emitter);
  }

  get once() {
    return this.emitter.once.bind(this.emitter);
  }

  get off() {
    return this.emitter.off.bind(this.emitter);
  }

  startGameTurn() {
    this.emitter.emit(
      TURN_EVENTS.TURN_START,
      new GameTurnEvent({ turnCount: this.elapsedTurns })
    );
    this._activePlayer.startTurn();
  }

  endGameTurn() {
    this._elapsedTurns++;
    this.emitter.emit(
      TURN_EVENTS.TURN_END,
      new GameTurnEvent({ turnCount: this.elapsedTurns })
    );
  }

  onPlayerTurnEnd() {
    const nextPlayer = this._activePlayer.opponent;
    if (nextPlayer.equals(this.firstPlayer)) {
      this.endGameTurn();
      this._activePlayer = nextPlayer;
      this.startGameTurn();
    } else {
      this._activePlayer = nextPlayer;
      this._activePlayer.startTurn();
    }
  }
}
