import type { Values } from '@game/shared';

export type Keyword = {
  id: string;
  name: string;
  description: string;
  iconId?: string;
  aliases: (string | RegExp)[];
};

export const KEYWORDS = {
  DRIFTER: {
    id: 'DRIFTER',
    name: 'Drifter',
    description:
      "This Creature moves to the opposite zone at the start of its owner's turn",
    aliases: []
  }
} as const satisfies Record<string, Keyword>;

export type KeywordName = Values<typeof KEYWORDS>['name'];
export type KeywordId = Values<typeof KEYWORDS>['id'];

export const getKeywordById = (id: KeywordId): Keyword | undefined =>
  Object.values(KEYWORDS).find(k => k.id === id);
