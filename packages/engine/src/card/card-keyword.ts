import type { Values } from '@game/shared';

export type Keyword = {
  id: string;
  name: string;
  description: string;
  iconId?: string;
  aliases: (string | RegExp)[];
};

export const KEYWORDS = {
  SUMMON: {
    id: 'SUMMON',
    name: 'Summon',
    description:
      'Triggers an effect when this card is played from the hand or evolution zone.',
    aliases: []
  },
  DRIFTER: {
    id: 'DRIFTER',
    name: 'Drifter',
    description:
      "This Creature moves to the opposite zone at the start of its owner's turn.",
    aliases: []
  },
  ATTACKER: {
    id: 'ATTACKER',
    name: 'Attacker(x)',
    description: 'If this creature is played in the Attacl Zone, it gains +X Attack.',
    aliases: [/^Attacker\(\d+\)$/]
  }
} as const satisfies Record<string, Keyword>;

export type KeywordName = Values<typeof KEYWORDS>['name'];
export type KeywordId = Values<typeof KEYWORDS>['id'];

export const getKeywordById = (id: KeywordId): Keyword | undefined =>
  Object.values(KEYWORDS).find(k => k.id === id);
