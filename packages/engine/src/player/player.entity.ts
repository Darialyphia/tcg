import { Entity } from '../entity';
import { type Game } from '../game/game';
import { assert, type EmptyObject, type Nullable, type Serializable } from '@game/shared';
import {
  PlayCardEvent,
  PlayerAfterReplaceCardEvent,
  PlayerBeforeReplaceCardEvent,
  PlayerEndTurnEvent,
  PlayerManaChangeEvent,
  PlayerMulliganEvent,
  PlayerStartTurnEvent,
  type PlayerEventMap
} from './player.events';
import { PLAYER_EVENTS } from './player-enums';
import { GamePlayerEvent } from '../game/game.events';
import { createCard } from '../card/card.factory';
import type { AnyCard, CardOptions } from '../card/entities/card.entity';
import type { Hero } from '../card/entities/hero.entity';
import type {
  CreatureBlueprint,
  EvolutionBlueprint,
  HeroBlueprint,
  ShardBlueprint,
  SpellBlueprint
} from '../card/card-blueprint';
import { CardManagerComponent } from '../card/card-manager.component';
import type { DeckCard } from '../card/entities/deck.entity';
import type { Evolution } from '../card/entities/evolution.entity';
import { CARD_KINDS } from '../card/card.enums';

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

  readonly evolutions: Evolution[];

  private mulliganIndices: number[] = [];

  private _hasMulliganed = false;

  _mana = 0;

  currentlyPlayedCard: Nullable<DeckCard> = null;

  private _hasPlayedShardOrManaThisTurn = false;

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
    this.evolutions = options.deck.evolutions.map(evolutionOptions =>
      createCard(game, this, evolutionOptions)
    );
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

  get isPlayer1() {
    return this.game.playerSystem.player1.equals(this);
  }

  get opponent() {
    return this.game.playerSystem.players.find(p => !p.equals(this))!;
  }

  get hasPlayedShardOrManaThisTurn() {
    return this._hasPlayedShardOrManaThisTurn;
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

  get discardPile() {
    return this.cards.discardPile;
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

  get discard() {
    return this.cards.discard.bind(this.cards);
  }

  get addToHand() {
    return this.cards.addToHand.bind(this.cards);
  }

  get maxMana() {
    return this.boardSide.totalMana;
  }

  get mana() {
    return this._mana;
  }

  private changeMana(amount: number) {
    this.emitter.emit(
      PLAYER_EVENTS.BEFORE_MANA_CHANGE,
      new PlayerManaChangeEvent({ amount })
    );
    this._mana = Math.min(0, this._mana + amount);
    this.emitter.emit(
      PLAYER_EVENTS.AFTER_MANA_CHANGE,
      new PlayerManaChangeEvent({ amount })
    );
  }

  spendMana(amount: number) {
    if (amount === 0) return;
    this.changeMana(-amount);
  }

  gainMana(amount: number) {
    if (amount === 0) return;
    this.changeMana(amount);
  }

  canSpendMana(amount: number) {
    return this.mana >= amount;
  }

  get hasMulliganed() {
    return this._hasMulliganed;
  }

  commitMulliganIndices(indices: number[]) {
    this.mulliganIndices = indices;
    this._hasMulliganed = true;
    this.emitter.emit(PLAYER_EVENTS.MULLIGAN, new PlayerMulliganEvent({ indices }));
  }

  mulligan() {
    for (const index of this.mulliganIndices) {
      this.cards.replaceCardAt(index);
    }
  }

  get attackZoneCreatures() {
    return this.boardSide.getCreatures('attack');
  }

  get defenseZoneCreatures() {
    return this.boardSide.getCreatures('defense');
  }

  putCardAtIndexInManaZone(index: number) {
    const card = this.cards.getCardAt(index);
    if (!card) return;

    this.putCardInManaZone(card);
  }

  putCardInManaZone(card: DeckCard) {
    this.cards.removeFromHand(card);
    this.boardSide.placeToManaZone(card);
    this._hasPlayedShardOrManaThisTurn = true;
  }

  playCardAtIndex(index: number) {
    const card = this.cards.getCardAt(index);
    if (!card) return;

    this.playCard(card);
  }

  playCard(card: DeckCard) {
    this.emitter.emit(PLAYER_EVENTS.BEFORE_PLAY_CARD, new PlayCardEvent({ card }));
    this.currentlyPlayedCard = card;
    this.cards.play(card);
    this.currentlyPlayedCard = null;
    if (card.kind === CARD_KINDS.SHARD) {
      this._hasPlayedShardOrManaThisTurn = true;
    }
    this.emitter.emit(PLAYER_EVENTS.AFTER_PLAY_CARD, new PlayCardEvent({ card }));
  }

  sendToDiscardPile(card: DeckCard | Evolution) {
    this.cards.sendToDiscardPile(card);
  }

  playEvolutionAt(index: number) {
    const evolution = this.evolutions[index];
    if (!evolution) return;

    this.playEvolution(evolution);
  }

  playEvolution(evolution: Evolution) {
    this.emitter.emit(
      PLAYER_EVENTS.BEFORE_PLAY_CARD,
      new PlayCardEvent({ card: evolution })
    );

    evolution.play();

    this.emitter.emit(
      PLAYER_EVENTS.AFTER_PLAY_CARD,
      new PlayCardEvent({ card: evolution })
    );
  }

  replaceCardAtIndex(index: number) {
    const card = this.getCardAt(index);
    assert(card, `Card not found at index ${index}`);
    this.emitter.emit(
      PLAYER_EVENTS.BEFORE_REPLACE_CARD,
      new PlayerBeforeReplaceCardEvent({ card })
    );
    const replacement = this.cards.replaceCardAt(index);
    this.emitter.emit(
      PLAYER_EVENTS.AFTER_REPLACE_CARD,
      new PlayerAfterReplaceCardEvent({ card, replacement })
    );
  }

  startTurn() {
    this.boardSide.convertShardToMana();
    this._mana = this.maxMana;
    this._hasPlayedShardOrManaThisTurn = false;

    this.draw(this.game.config.CARDS_DRAWN_PER_TURN);

    this.emitter.emit(PLAYER_EVENTS.START_TURN, new PlayerStartTurnEvent({}));
  }

  endTurn() {
    this.emitter.emit(PLAYER_EVENTS.END_TURN, new PlayerEndTurnEvent({}));
  }
}
