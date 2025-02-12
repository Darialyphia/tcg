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
import { CardManagerComponent } from '../card/card-manager.component';

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

  private readonly cards: CardManagerComponent;

  readonly hero: Hero;

  constructor(
    game: Game,
    private options: PlayerOptions
  ) {
    super(options.id, {});
    this.game = game;
    this.hero = createCard(game, this, options.deck.hero);
    this.cards = new CardManagerComponent(game, this, {
      deck: options.deck.cards,
      maxHandSize: this.game.config.INITIAL_HAND_SIZE,
      shouldShuffleDeck: this.game.config.SHUFFLE_DECK_AT_START_OF_GAME
    });
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

  get maxHandSize() {
    return this.game.config.MAX_HAND_SIZE;
  }

  get hand() {
    return this.cards.hand;
  }

  get deck() {
    return this.cards.deck;
  }

  get deckSize() {
    return this.cards.deckSize;
  }

  get remainingCardsInDeck() {
    return this.cards.remainingCardsInDeck;
  }

  get getCardAt() {
    return this.cards.getCardAt.bind(this.cards);
  }

  get draw() {
    return this.cards.draw.bind(this.cards);
  }

  get addToHand() {
    return this.cards.addToHand.bind(this.cards);
  }

  startTurn() {}
}
