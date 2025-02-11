import { Entity } from '../entity';
import { type Game } from '../game/game';
import { type EmptyObject, type Serializable } from '@game/shared';
import type { PlayerEventMap } from './player.events';
import { PLAYER_EVENTS } from './player-enums';
import { GamePlayerEvent } from '../game/game.events';
import { createCard } from '../card/card.factory';
import type { CardOptions } from '../card/entities/card.entity';
import type { Hero } from '../card/entities/hero.entity';
import type {
  CreatureBlueprint,
  EvolutionBlueprint,
  HeroBlueprint,
  ShardBlueprint,
  SpellBlueprint
} from '../card/card-blueprint';

export type PlayerOptions = {
  id: string;
  name: string;
  deck: {
    hero: CardOptions<HeroBlueprint>;
    cards: Array<CardOptions<CreatureBlueprint | SpellBlueprint | ShardBlueprint>>;
    evolutions: Array<CardOptions<EvolutionBlueprint>>;
  };
};

export type SerializedPlayer = {
  id: string;
  name: string;
};

export class Player
  extends Entity<PlayerEventMap, EmptyObject>
  implements Serializable<SerializedPlayer>
{
  private game: Game;

  readonly hero: Hero;

  constructor(
    game: Game,
    private options: PlayerOptions
  ) {
    super(options.id, {});
    this.game = game;
    this.hero = createCard(game, this, options.deck.hero);
    this.forwardListeners();
  }

  serialize() {
    return {
      id: this.id,
      name: this.options.name
    };
  }

  forwardListeners() {
    Object.values(PLAYER_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `player.${eventName}`,
          new GamePlayerEvent({ player: this, event }) as any
        );
      });
    });
  }

  get opponent() {
    return this.game.playerSystem.players.find(p => !p.equals(this))!;
  }

  get boardSide() {
    return this.game.board.sides.find(side => side.player.equals(this))!;
  }

  startTurn() {}
}
