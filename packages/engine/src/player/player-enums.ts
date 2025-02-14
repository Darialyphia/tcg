import type { Values } from '@game/shared';

export const PLAYER_EVENTS = {
  START_TURN: 'start_turn',
  END_TURN: 'end_turn',
  BEFORE_MANA_CHANGE: 'before_mana_change',
  AFTER_MANA_CHANGE: 'after_mana_change',
  // BEFORE_DRAW: 'before_draw',
  // AFTER_DRAW: 'after_draw',
  BEFORE_PLAY_CARD: 'before_play_card',
  AFTER_PLAY_CARD: 'after_play_card',
  BEFORE_REPLACE_CARD: 'before_replace_card',
  AFTER_REPLACE_CARD: 'after_replace_card',
  MULLIGAN: 'mulligan'
} as const;

export type PlayerEvent = Values<typeof PLAYER_EVENTS>;
