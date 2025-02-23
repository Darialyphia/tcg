import { CardSet } from '../../entities/card-set.entity';
import { f1FireShard } from './faction1/fire-shard';
import { f1Quartermaster } from './faction1/quartermaster';
import { f1Rogue } from './faction1/rogue';

export const coreSet = new CardSet('core', 'Core Set', [
  f1FireShard,
  f1Rogue,
  f1Quartermaster
]);
