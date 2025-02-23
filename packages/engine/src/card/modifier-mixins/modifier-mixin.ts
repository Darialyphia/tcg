import type { Game } from '../../game/game';
import type { Modifier, ModifierTarget } from '../entities/modifier.entity';

export abstract class ModifierMixin<TCard extends ModifierTarget> {
  protected game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  abstract onApplied(unit: TCard, modifier: Modifier<TCard>): void;
  abstract onRemoved(unit: TCard, modifier: Modifier<TCard>): void;
  abstract onReapplied(unit: TCard, modifier: Modifier<TCard>, stacks?: number): void;
}
