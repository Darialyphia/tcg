import type { Game } from '../../game/game';
import { GAME_EVENTS, type StarEvent } from '../../game/game.events';
import type { Player } from '../player.entity';

export class EventTrackerComponent {
  private lastTurnEvents: StarEvent[] = [];

  constructor(
    private game: Game,
    private player: Player
  ) {
    let currentTurnEvents: StarEvent[] = [];
    game.on('*', e => {
      if (e.eventName === GAME_EVENTS.PLAYER_END_TURN) {
        this.lastTurnEvents = currentTurnEvents;
        currentTurnEvents = [];
      } else {
        currentTurnEvents.push(e);
      }
    });
  }
}
