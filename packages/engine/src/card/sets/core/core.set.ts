import { CardSet } from '../../entities/card-set.entity';
import { f1BurningDesire } from './faction1/burning-desire';
import { f1FireShard } from './faction1/fire-shard';
import { f1Fireball } from './faction1/fireball';
import { f1Quartermaster } from './faction1/quartermaster';
import { f1Rogue } from './faction1/rogue';
import { f1RoyalMage } from './faction1/royal-mage';
import { f1SwordInstructor } from './faction1/sword-instructor';

export const coreSet = new CardSet('core', 'Core Set', [
  f1FireShard,
  f1Rogue,
  f1Quartermaster,
  f1SwordInstructor,
  f1RoyalMage,
  f1Fireball,
  f1BurningDesire
]);
