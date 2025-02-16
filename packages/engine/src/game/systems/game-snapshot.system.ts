import { type AnyObject, type EmptyObject, type Nullable } from '@game/shared';
import { System } from '../../system';
import { type GameStarEvent, type SerializedStarEvent } from '../game.events';
import type { SerializedHero } from '../../card/entities/hero.entity';
import type { SerializedCreature } from '../../card/entities/creature.entity';
import type { SerializedEvolution } from '../../card/entities/evolution.entity';
import type { SerializedSpell } from '../../card/entities/spell.entity';
import type { SerializedShard } from '../../card/entities/shard.entity';
import type { SerializedCard } from '../../card/entities/card.entity';
import type { SerializedPlayer } from '../../player/player.entity';

export type GameStateSnapshot = {
  id: number;
  state: AnyObject;
  events: SerializedStarEvent[];
};

type SerializedCreatureZone = {
  cards: [
    Nullable<SerializedCreature | SerializedEvolution>,
    Nullable<SerializedCreature | SerializedEvolution>,
    Nullable<SerializedCreature | SerializedEvolution>,
    Nullable<SerializedCreature | SerializedEvolution>,
    Nullable<SerializedCreature | SerializedEvolution>
  ];
  enchants: SerializedSpell[];
};
type SerializedOmniscientBoardSide = {
  hero: {
    card: SerializedHero;
    enchants: SerializedSpell[];
  };
  attackZone: SerializedCreatureZone;
  defenseZone: SerializedCreatureZone;
  manaZone: SerializedCard[];
  shardZone: Nullable<SerializedShard>;
  evolution: Nullable<SerializedEvolution>;
};

type SerializedOmniscientBoard = {
  board: {
    sides: [SerializedOmniscientBoardSide, SerializedOmniscientBoardSide];
    columnEnchants: [
      Nullable<SerializedSpell>,
      Nullable<SerializedSpell>,
      Nullable<SerializedSpell>,
      Nullable<SerializedSpell>,
      Nullable<SerializedSpell>
    ];
  };
};

export type SerializedOmniscientState = {
  board: SerializedOmniscientBoard;
  elapsedTurns: number;
  activePlayer: SerializedPlayer;
  players: [SerializedPlayer, SerializedPlayer];
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

  serializeOmniscientState() {
    return {};
  }

  serializePlayerState(playerId: string) {
    return {};
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
