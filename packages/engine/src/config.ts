export type Config = {
  // the amount of cards drawn at the start of the game
  INITIAL_HAND_SIZE: number;
  // the maximum amount of cards a player can hold at once in their hand
  MAX_HAND_SIZE: number;
  // how many cards every player draws at the start of each turn
  CARDS_DRAWN_PER_TURN: number;
  // Should the deck be shuffled at the start of the game (this is useeful for testing or tutorials)
  SHUFFLE_DECK_AT_START_OF_GAME: boolean;
};

export const defaultConfig = {
  INITIAL_HAND_SIZE: 3,
  MAX_HAND_SIZE: 8,
  CARDS_DRAWN_PER_TURN: 1,
  SHUFFLE_DECK_AT_START_OF_GAME: true
} as const;
