import type { Game } from '../../game/game';
import type {
  inferInterceptorCtx,
  inferInterceptorValue
} from '../../utils/interceptable';
import type { Creature, CreatureInterceptors } from '../entities/creature.entity';
import { Evolution } from '../entities/evolution.entity';
import type { Modifier } from '../entities/modifier.entity';
import { ModifierMixin } from './modifier-mixin';

export class CreatureInterceptorModifierMixin<
  TKey extends keyof CreatureInterceptors
> extends ModifierMixin<Creature | Evolution> {
  private modifier!: Modifier<Creature | Evolution>;

  constructor(
    game: Game,
    private options: {
      key: TKey;
      interceptor: (
        value: inferInterceptorValue<CreatureInterceptors[TKey]>,
        ctx: inferInterceptorCtx<CreatureInterceptors[TKey]>,
        modifier: Modifier<Creature | Evolution>
      ) => inferInterceptorValue<CreatureInterceptors[TKey]>;
    }
  ) {
    super(game);
    this.interceptor = this.interceptor.bind(this);
  }

  interceptor(
    value: inferInterceptorValue<CreatureInterceptors[TKey]>,
    ctx: inferInterceptorCtx<CreatureInterceptors[TKey]>
  ) {
    return this.options.interceptor(value, ctx, this.modifier);
  }

  onApplied(card: Creature | Evolution, modifier: Modifier<Creature | Evolution>): void {
    this.modifier = modifier;
    card.addInterceptor(this.options.key, this.interceptor as any);
  }

  onRemoved(card: Creature | Evolution): void {
    card.removeInterceptor(this.options.key, this.interceptor as any);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onReapplied() {}
}
