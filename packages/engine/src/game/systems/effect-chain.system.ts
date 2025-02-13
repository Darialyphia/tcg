import { assert, type Nullable } from '@game/shared';
import { System } from '../../system';
import { EffectChain, type Effect } from '../effect-chain';
import type { Player } from '../../player/player.entity';

export class EffectChainSystem extends System<never> {
  private _currentChain: Nullable<EffectChain> = null;

  initialize() {}

  shutdown() {}

  createChain(player: Player, onResolved: () => void) {
    this._currentChain = new EffectChain(this.game, player, () => {
      onResolved();
      this._currentChain = null;
    });
  }

  get currentChain() {
    return this._currentChain;
  }

  addEffect(effect: Effect, player: Player) {
    assert(this._currentChain, 'No active effect chain');
    this._currentChain.addEffect(effect, player);
  }

  start(effect: Effect, player: Player) {
    assert(this._currentChain, 'No active effect chain');
    this._currentChain.start(effect, player);
  }

  pass(player: Player) {
    assert(this._currentChain, 'No active effect chain');
    this._currentChain.pass(player);
  }

  cancel(player: Player) {
    assert(this._currentChain, 'No active effect chain');
    this._currentChain.cancel(player);
  }
}
