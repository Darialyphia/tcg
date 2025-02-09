import { type AnyObject, type EmptyObject } from '@game/shared';
import { System } from '../system';
import { type StarEvent } from './game';

export type GameStateSnapshot = {
  id: number;
  state: AnyObject;
  events: any[];
};

export class GameSnaphotSystem extends System<EmptyObject> {
  private cache: GameStateSnapshot[] = [];

  private eventsSinceLastSnapshot: StarEvent[] = [];

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
      events: [...this.eventsSinceLastSnapshot]
    };

    this.cache.push(snapshot);
    this.eventsSinceLastSnapshot = [];
    return snapshot;
  }
}
