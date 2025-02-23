import { Game } from '../../game/game';
import type { CreatureEventMap } from '../card.events';
import type { Creature } from '../entities/creature.entity';
import type { Evolution } from '../entities/evolution.entity';
import { Modifier } from '../entities/modifier.entity';
import { ModifierMixin } from './modifier-mixin';

export class SelfEventModifierMixin<
  TEvent extends keyof CreatureEventMap
> extends ModifierMixin<Creature | Evolution> {
  private modifier!: Modifier<Creature | Evolution>;

  constructor(
    game: Game,
    private options: {
      eventName: TEvent;
      handler: (
        event: CreatureEventMap[TEvent],
        modiier: Modifier<Creature | Evolution>
      ) => void;
      once?: boolean;
    }
  ) {
    super(game);
    this.handler = this.handler.bind(this);
  }

  handler(event: CreatureEventMap[TEvent]) {
    this.options.handler(event, this.modifier);
  }

  onApplied(card: Creature | Evolution, modifier: Modifier<Creature | Evolution>): void {
    this.modifier = modifier;
    if (this.options.once) {
      card.once(this.options.eventName, this.handler as any);
    } else {
      card.on(this.options.eventName, this.handler as any);
    }
  }

  onRemoved(card: Creature | Evolution): void {
    card.off(this.options.eventName, this.handler as any);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onReapplied(): void {}
}
