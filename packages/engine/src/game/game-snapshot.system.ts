import { type AnyObject, type EmptyObject } from '@game/shared';
import { System } from '../system';
import { type GameStarEvent, type SerializedStarEvent } from './game.events';

export type GameStateSnapshot = {
  id: number;
  state: AnyObject;
  events: SerializedStarEvent[];
};

export class GameSnaphotSystem extends System<EmptyObject> {
  private cache: GameStateSnapshot[] = [];

  private eventsSinceLastSnapshot: GameStarEvent[] = [];

  private nextId = -1;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initialize(): void {
    this.game.on('*', event => {
      this.eventsSinceLastSnapshot.push(event);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  shutdown() {}

  getSnapshotAt(index: number): GameStateSnapshot {
    const snapshot = this.cache[index];
    if (!snapshot) {
      throw new Error(`Gamestate snapshot unavailable for index ${index}`);
    }

    return snapshot;
  }

  getLatestSnapshot(): GameStateSnapshot {
    return this.getSnapshotAt(this.nextId);
  }

  makeSnapshot() {
    const snapshot: GameStateSnapshot = {
      id: this.nextId++,
      state: {},
      events: this.eventsSinceLastSnapshot.map(event => event.serialize())
    };

    this.cache.push(snapshot);
    this.eventsSinceLastSnapshot = [];
    return snapshot;
  }
}
