import {
  type AnyObject,
  type EmptyObject,
  type Nullable,
  type Override
} from '@game/shared';
import { System } from '../../system';
import { type GameStarEvent, type SerializedStarEvent } from '../game.events';
import type { SerializedPlayer } from '../../player/player.entity';
import type { SerialiedInteractionStateContext } from './interaction.system';
import type { SerializedEffectChain } from '../effect-chain';
import type { SerializedBoard, SerializedBoardSide } from './game-board.system';

export type GameStateSnapshot = {
  id: number;
  state: AnyObject;
  events: SerializedStarEvent[];
};

type SerializedHiddenBoardSide = Override<SerializedBoardSide, { hand: number }>;

export type SerializedOmniscientState = {
  board: SerializedBoard;
  elapsedTurns: number;
  activePlayer: SerializedPlayer;
  players: [SerializedPlayer, SerializedPlayer];
  interactionState: SerialiedInteractionStateContext;
  effectChain: SerializedEffectChain | null;
};

export type SerializedPlayerState = {
  board: Override<
    SerializedBoard,
    { sides: [SerializedBoardSide, SerializedHiddenBoardSide] }
  >;
  elapsedTurns: number;
  activePlayer: SerializedPlayer;
  players: [SerializedPlayer, SerializedPlayer];
  interactionState: SerialiedInteractionStateContext;
  effectChain: SerializedEffectChain | null;
};

export class GameSnaphotSystem extends System<EmptyObject> {
  private caches: Record<string, GameStateSnapshot[]> = {
    omniscient: []
  };
  private omniscientCache: GameStateSnapshot[] = [];

  private eventsSinceLastSnapshot: GameStarEvent[] = [];

  private nextId = -1;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initialize(): void {
    this.game.on('*', event => {
      this.eventsSinceLastSnapshot.push(event);
    });
    this.caches[this.game.playerSystem.player1.id] = [];
    this.caches[this.game.playerSystem.player2.id] = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  shutdown() {}

  getOmniscientSnapshotAt(index: number): GameStateSnapshot {
    const snapshot = this.omniscientCache[index];
    if (!snapshot) {
      throw new Error(`Gamestate snapshot unavailable for index ${index}`);
    }

    return snapshot;
  }

  geSnapshotForPlayerAt(playerId: string, index: number): GameStateSnapshot {
    const snapshot = this.caches[playerId][index];
    if (!snapshot) {
      throw new Error(`Gamestate snapshot unavailable for index ${index}`);
    }

    return snapshot;
  }

  getLatestOmniscientSnapshot(): GameStateSnapshot {
    return this.getOmniscientSnapshotAt(this.nextId);
  }

  getLatestSnapshotForPlayer(playerId: string): GameStateSnapshot {
    return this.geSnapshotForPlayerAt(playerId, this.nextId);
  }

  serializeOmniscientState(): SerializedOmniscientState {
    return {
      board: this.game.board.serialize(),
      elapsedTurns: this.game.turnSystem.elapsedTurns,
      activePlayer: this.game.turnSystem.activePlayer.serialize(),
      players: this.game.playerSystem.players.map(player => player.serialize()) as [
        SerializedPlayer,
        SerializedPlayer
      ],
      interactionState: this.game.interaction.serialize(),
      effectChain: this.game.effectChainSystem.currentChain?.serialize() ?? null
    };
  }

  serializePlayerState(playerId: string): SerializedPlayerState {
    const serialized = this.serializeOmniscientState();
    return {
      ...serialized,
      board: {
        ...serialized.board,
        sides: serialized.board.sides
          .map(side => {
            if (side.playerId === playerId) {
              return side;
            }

            return {
              ...side,
              hand: side.hand.length
            };
          })
          .sort(a => (a.playerId === playerId ? -1 : 1)) as [
          SerializedBoardSide,
          SerializedHiddenBoardSide
        ]
      }
    };
  }

  makeSnapshot() {
    const events = this.eventsSinceLastSnapshot.map(event => event.serialize());
    const id = this.nextId++;
    this.caches[this.game.playerSystem.player1.id].push({
      id,
      events,
      state: this.serializePlayerState(this.game.playerSystem.player1.id)
    });

    this.caches[this.game.playerSystem.player2.id].push({
      id,
      events,
      state: this.serializePlayerState(this.game.playerSystem.player2.id)
    });

    this.omniscientCache.push({
      id,
      events,
      state: this.serializeOmniscientState()
    });

    this.eventsSinceLastSnapshot = [];
  }
}
