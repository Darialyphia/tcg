export type Config = {
  // the amount of cards drawn at the start of the game
  INITIAL_HAND_SIZE: number;
  // the maximum amount of cards a player can hold at once in their hand
  MAX_HAND_SIZE: number;
  // how many cards every player draws at the start of each turn
  CARDS_DRAWN_PER_TURN: number;
  // Should the deck be shuffled at the start of the game (this is useeful for testing or tutorials)
  SHUFFLE_DECK_AT_START_OF_GAME: boolean;
  // The mana cose of the hero draw action
  HERO_DRAW_ACTION_MANA_COST: number;
};

export const defaultConfig = {
  INITIAL_HAND_SIZE: 6,
  MAX_HAND_SIZE: 10,
  CARDS_DRAWN_PER_TURN: 1,
  SHUFFLE_DECK_AT_START_OF_GAME: true,
  HERO_DRAW_ACTION_MANA_COST: 1
} as const;
