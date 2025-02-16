import type { Game } from '../game/game';
import { type CardOptions } from './entities/card.entity';
import type { Player } from '../player/player.entity';
import { Deck, type DeckCard } from './entities/deck.entity';
import { createCard } from './card.factory';
import type { CreatureBlueprint, ShardBlueprint, SpellBlueprint } from './card-blueprint';
import type { Evolution } from './entities/evolution.entity';

export type CardManagerComponentOptions = {
  deck: CardOptions<CreatureBlueprint | SpellBlueprint | ShardBlueprint>[];
  maxHandSize: number;
  shouldShuffleDeck: boolean;
};

export class CardManagerComponent {
  private game: Game;

  readonly deck: Deck;

  readonly hand: DeckCard[] = [];

  readonly discardPile = new Set<DeckCard | Evolution>();

  constructor(
    game: Game,
    player: Player,
    private options: CardManagerComponentOptions
  ) {
    this.game = game;
    this.deck = new Deck(
      this.game,
      options.deck.map(card => createCard(this.game, player, card))
    );
    if (options.shouldShuffleDeck) {
      this.deck.shuffle();
    }
  }

  get isHandFull() {
    return this.hand.length === this.options.maxHandSize;
  }

  get remainingCardsInDeck() {
    return this.deck.remaining;
  }

  get deckSize() {
    return this.deck.size;
  }

  getCardAt(index: number) {
    return [...this.hand][index];
  }

  draw(amount: number) {
    if (this.isHandFull) return;

    const cards = this.deck.draw(
      Math.min(amount, this.options.maxHandSize - this.hand.length)
    );

    cards.forEach(card => {
      this.hand.push(card);
    });
  }

  removeFromHand(card: DeckCard) {
    const index = this.hand.findIndex(handCard => handCard.equals(card));
    this.hand.splice(index, 1);
  }

  discard(card: DeckCard) {
    this.removeFromHand(card);
    this.sendToDiscardPile(card);
  }

  play(card: DeckCard) {
    if (!this.hand.includes(card)) return;
    this.removeFromHand(card);
    card.play();
  }

  sendToDiscardPile(card: DeckCard | Evolution) {
    this.discardPile.add(card);
  }

  replaceCardAt(index: number) {
    const card = this.getCardAt(index);
    if (!card) return card;

    const replacement = this.deck.replace(card);
    this.hand[index] = replacement;
    return replacement;
  }

  addToHand(card: DeckCard) {
    if (this.isHandFull) return;
    this.hand.push(card);
  }

  shutdown() {
    this.deck.cards.forEach(card => {
      card.shutdown();
    });
    this.hand.forEach(card => {
      card.shutdown();
    });
    this.discardPile.forEach(card => {
      card.shutdown();
    });
  }
}
