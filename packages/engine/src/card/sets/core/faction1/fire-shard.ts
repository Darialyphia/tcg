import type { ShardBlueprint } from '../../../card-blueprint';
import { CARD_KINDS, CARD_SETS, FACTIONS, RARITIES } from '../../../card.enums';

export const f1FireShard: ShardBlueprint = {
  id: 'f1-fire-shard',
  kind: CARD_KINDS.SHARD,
  name: 'Fire Shard',
  description: 'When this card is put in the Shard Zone, draw a card.',
  faction: FACTIONS.F1,
  imageId: 'fire-shard',
  loyalty: 0,
  rarity: RARITIES.COMMON,
  setId: CARD_SETS.CORE,
  onInit: () => {},
  onPlay(game, card) {
    card.player.draw(1);
  }
};
