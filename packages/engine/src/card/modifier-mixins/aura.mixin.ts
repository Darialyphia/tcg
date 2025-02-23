import { Game } from '../../game/game';
import { CREATURE_EVENTS } from '../card.enums';
import type { AnyCard } from '../entities/card.entity';
import type { Creature } from '../entities/creature.entity';
import type { Evolution } from '../entities/evolution.entity';
import { Modifier } from '../entities/modifier.entity';
import { ModifierMixin } from './modifier-mixin';

export type AuraOptions = {
  isElligible(unit: AnyCard): boolean;
  onGainAura(unit: AnyCard): void;
  onLoseAura(unit: AnyCard): void;
};

export abstract class AuraModifierMixin extends ModifierMixin<Creature | Evolution> {
  protected modifier!: Modifier<Creature | Evolution>;

  private affectedCardsIds = new Set<string>();

  // we need to track this variable because of how the event emitter works
  // basically if we have an event that says "after unit moves, remove this aura modifier"
  // It will not clean up aura's "after unit move" event before all the current listeners have been ran
  // which would lead to removing the aura, THEN check and apply the aura anyways
  private isApplied = true;

  constructor(
    game: Game,
    private options: AuraOptions
  ) {
    super(game);
    this.checkAura = this.checkAura.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  get allCardsInPlay() {
    return this.game.playerSystem.players.flatMap(player =>
      player.boardSide.getAllCardsInPlay()
    );
  }

  private checkAura() {
    if (!this.isApplied) return;

    this.allCardsInPlay.forEach(card => {
      if (card.equals(this.modifier.target)) return;
      const shouldGetAura = this.options.isElligible(card);

      const hasAura = this.affectedCardsIds.has(card.id);

      if (!shouldGetAura && hasAura) {
        this.affectedCardsIds.delete(card.id);
        this.options.onLoseAura(card);
        return;
      }

      if (shouldGetAura && !hasAura) {
        this.affectedCardsIds.add(card.id);
        this.options.onGainAura(card);
        return;
      }
    });
  }

  private cleanup() {
    this.game.off('*', this.checkAura);

    this.affectedCardsIds.forEach(id => {
      const card = this.allCardsInPlay.find(c => c.id === id);
      if (!card) return;

      this.affectedCardsIds.delete(id);
      this.options.onLoseAura(card);
    });
  }

  onApplied(card: Creature | Evolution, modifier: Modifier<Creature | Evolution>): void {
    this.modifier = modifier;
    this.isApplied = true;

    this.game.on('*', this.checkAura);
    card.once(CREATURE_EVENTS.BEFORE_DESTROYED, this.cleanup);
  }

  onRemoved() {
    this.isApplied = false;
    this.cleanup();
  }

  onReapplied() {}
}
