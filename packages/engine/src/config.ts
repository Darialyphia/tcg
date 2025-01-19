export type Config = {
  // the amount of cards drawn at the start of the game
  INITIAL_HAND_SIZE: number;
  // the maximum amount of cards a player can hold at once in their hand
  MAX_HAND_SIZE: number;
  // how many cards every player draws at the start of each turn
  CARDS_DRAWN_PER_TURN: number;
  // how many gold player start the game with
};

export const defaultConfig = {
  INITIAL_HAND_SIZE: 3,
  MAX_HAND_SIZE: 8,
  CARDS_DRAWN_PER_TURN: 1
} as const;
