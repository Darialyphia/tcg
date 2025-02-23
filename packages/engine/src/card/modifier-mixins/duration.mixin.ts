import { Game } from '../../game/game';
import { PLAYER_EVENTS } from '../../player/player-enums';
import { Modifier, type ModifierTarget } from '../entities/modifier.entity';
import { ModifierMixin } from './modifier-mixin';

export class DurationModifierMixin extends ModifierMixin<ModifierTarget> {
  private modifier!: Modifier<ModifierTarget>;

  constructor(
    game: Game,
    private duration = 1
  ) {
    super(game);
    this.onTurnStart = this.onTurnStart.bind(this);
  }

  onTurnStart() {
    this.duration--;
    if (this.duration === 0) {
      this.modifier.target.removeModifier(this.modifier.id);
    }
  }

  onApplied(card: ModifierTarget, modifier: Modifier<ModifierTarget>): void {
    this.modifier = modifier;
    card.player.on(PLAYER_EVENTS.START_TURN, this.onTurnStart);
  }

  onRemoved(card: ModifierTarget): void {
    card.player.off(PLAYER_EVENTS.START_TURN, this.onTurnStart);
  }

  onReapplied(): void {}
}
