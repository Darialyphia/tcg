import { Game } from '../../game/game';
import { PLAYER_EVENTS } from '../../player/player-enums';
import type { Player } from '../../player/player.entity';
import { Modifier, type ModifierTarget } from '../entities/modifier.entity';

import { ModifierMixin } from './modifier-mixin';
export class UntilEndOfTurnModifierMixin extends ModifierMixin<ModifierTarget> {
  private modifier!: Modifier<ModifierTarget>;

  private player!: Player;

  constructor(game: Game) {
    super(game);
    this.onTurnEnd = this.onTurnEnd.bind(this);
  }

  onTurnEnd() {
    this.modifier.target.removeModifier(this.modifier.id);
  }

  onApplied(card: ModifierTarget, modifier: Modifier<ModifierTarget>): void {
    this.modifier = modifier;
    this.player = this.game.turnSystem.activePlayer;
    this.player.once(PLAYER_EVENTS.END_TURN, this.onTurnEnd);
  }

  onRemoved(): void {
    this.player.off(PLAYER_EVENTS.END_TURN, this.onTurnEnd);
  }

  onReapplied(): void {}
}
