import type { Keyword } from '../../card/card-keyword';
import { Game } from '../../game/game';
import type { ModifierTarget } from '../entities/modifier.entity';
import { ModifierMixin } from './modifier-mixin';

export class KeywordModifierMixin extends ModifierMixin<ModifierTarget> {
  constructor(
    game: Game,
    private keyword: Keyword
  ) {
    super(game);
  }

  onApplied(card: ModifierTarget): void {
    card.addKeyword(this.keyword);
  }

  onRemoved(card: ModifierTarget): void {
    card.removeKeyword(this.keyword);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onReapplied(): void {}
}
