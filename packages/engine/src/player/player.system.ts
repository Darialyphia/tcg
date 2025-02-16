import { System } from '../system';
import { Player, type PlayerOptions } from './player.entity';

export type PlayerSystemOptions = {
  players: Array<PlayerOptions>;
};

export class PlayerSystem extends System<PlayerSystemOptions> {
  private playerMap = new Map<string, Player>();

  initialize(options: PlayerSystemOptions): void {
    options.players.forEach(p => {
      const player = new Player(this.game, p);
      this.playerMap.set(player.id, player);
    });
  }

  shutdown() {
    this.players.forEach(player => player.shutdown());
  }

  getPlayerById(id: string) {
    return this.playerMap.get(id);
  }

  get players() {
    return [...this.playerMap.values()] as [Player, Player];
  }

  get player1() {
    return this.players[0];
  }

  get player2() {
    return this.players[1];
  }
}
