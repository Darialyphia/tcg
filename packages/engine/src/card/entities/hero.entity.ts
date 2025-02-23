import { Card, type AnyCard, type CardOptions, type SerializedCard } from './card.entity';
import type { Ability, HeroBlueprint } from '../card-blueprint';
import type { HeroEventMap } from '../card.events';
import type { Attacker, Damage } from '../../combat/damage';
import { Interceptable } from '../../utils/interceptable';
import type { Player } from '../../player/player.entity';
import type { Game } from '../../game/game';
import { HealthComponent } from '../../combat/health.component';
import { HERO_EVENTS } from '../card.enums';
import { GameCardEvent } from '../../game/game.events';
import { assert, isDefined } from '@game/shared';
import type { SelectedTarget } from '../../game/systems/interaction.system';
import { PLAYER_EVENTS } from '../../player/player-enums';
import { ModifierManager } from '../components/modifier-manager.component';
import type { Modifier } from './modifier.entity';

export type SerializedHero = SerializedCard & {
  maxHp: number;
};

const makeInterceptors = () => ({
  maxHp: new Interceptable<number>(),

  canBeAttackTarget: new Interceptable<boolean, { attacker: Attacker }>(),

  damageReceived: new Interceptable<
    number,
    { amount: number; source: AnyCard; damage: Damage<AnyCard> }
  >()
});
type HeroInterceptors = ReturnType<typeof makeInterceptors>;

export class Hero extends Card<
  SerializedHero,
  HeroEventMap,
  HeroInterceptors,
  HeroBlueprint
> {
  readonly health: HealthComponent;

  readonly modifierManager: ModifierManager<Hero>;

  private _isExhausted = false;

  constructor(game: Game, player: Player, options: CardOptions) {
    super(game, player, makeInterceptors(), options);
    this.health = new HealthComponent({
      initialValue: this.maxHp
    });
    this.modifierManager = new ModifierManager(this);
    this.forwardListeners();
    this.player.on(PLAYER_EVENTS.START_TURN, () => {
      this._isExhausted = false;
    });
  }

  canBeAttackTarget(attacker: Attacker) {
    return this.interceptors.canBeAttackTarget.getValue(true, { attacker });
  }

  get faction() {
    return this.blueprint.faction;
  }
  get maxHp(): number {
    return this.interceptors.maxHp.getValue(this.blueprint.maxHp, {});
  }

  get isDead() {
    return this.health.isDead;
  }

  get isExhausted() {
    return this._isExhausted;
  }

  getReceivedDamage<T extends AnyCard>(amount: number, damage: Damage<T>, from: AnyCard) {
    return this.interceptors.damageReceived.getValue(amount, {
      source: from,
      damage,
      amount
    });
  }

  private resolveAbility(ability: Ability<Hero>, targets: SelectedTarget[]) {
    this.player.spendMana(ability.manaCost);
    ability.onResolve(this.game, this, targets);
    this._isExhausted = true;
  }

  selectAbilityTargets(
    ability: Ability<Hero>,
    onComplete: (targets: SelectedTarget[]) => void
  ) {
    assert(
      this.blueprint.abilities.includes(ability),
      "The ability doesn't belong to this creature"
    );

    const followup = ability.getFollowup(this.game, this);

    this.game.interaction.startSelectingTargets({
      getNextTarget: targets => followup.targets[targets.length] ?? null,
      canCommit: followup.canCommit,
      onComplete
    });
  }

  declareAbility(index: number) {
    assert(!this.isExhausted, 'Creature is exhausted');
    assert(
      !this.game.effectChainSystem.currentChain,
      'There is already an ongoing chain'
    );
    const ability = this.blueprint.abilities[index];
    assert(isDefined(ability), 'Ability not found');

    this.selectAbilityTargets(ability, targets => {
      this.game.effectChainSystem.createChain(this.player, () => {});
      this.game.effectChainSystem.start(
        {
          source: this,
          handler: () => {
            this.resolveAbility(this.blueprint.abilities[index], targets);
          }
        },
        this.player
      );
    });
  }

  addAbilityToChain(index: number) {
    assert(!this.isExhausted, 'Creature is exhausted');
    assert(this.game.effectChainSystem.currentChain, 'No ongoing effect chain');
    const ability = this.blueprint.abilities[index];
    assert(isDefined(ability), 'Ability not found');

    const chain = this.game.effectChainSystem.currentChain;

    this.selectAbilityTargets(ability, targets => {
      chain.addEffect(
        {
          source: this,
          handler: () => {
            this.resolveAbility(this.blueprint.abilities[index], targets);
          }
        },
        this.player
      );
    });
  }

  drawCard() {
    assert(!this.isExhausted, 'Hero is exhausted');
    this.player.spendMana(this.game.config.HERO_DRAW_ACTION_MANA_COST);
    this.player.draw(1);
    this._isExhausted = true;
  }

  replace(index: number) {
    assert(!this.isExhausted, 'Hero is exhausted');
    this.player.replaceCardAtIndex(index);
    this._isExhausted = true;
  }

  receiveDamage(damage: Damage<AnyCard>) {
    this.health.remove(damage.getFinalAmount(this));
  }

  play() {}

  get removeModifier() {
    return this.modifierManager.remove.bind(this.modifierManager);
  }

  get hasModifier() {
    return this.modifierManager.has.bind(this.modifierManager);
  }

  get getModifier() {
    return this.modifierManager.get.bind(this.modifierManager);
  }

  get modifiers() {
    return this.modifierManager.modifiers;
  }

  addModifier(modifier: Modifier<Hero>) {
    this.modifierManager.add(modifier);

    return () => this.removeModifier(modifier.id);
  }

  forwardListeners() {
    Object.values(HERO_EVENTS).forEach(eventName => {
      this.on(eventName, event => {
        this.game.emit(
          `card.${eventName}`,
          new GameCardEvent({ card: this, event: event as any }) as any
        );
      });
    });
  }

  serialize(): SerializedHero {
    return {
      id: this.id,
      name: this.name,
      imageId: this.imageId,
      description: this.description,
      kind: this.kind,
      maxHp: this.maxHp,
      rarity: this.rarity,
      faction: this.faction?.serialize() ?? null
    };
  }
}
