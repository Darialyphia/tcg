import { isString, type Constructor } from '@game/shared';
import { Modifier, type ModifierTarget } from '../entities/modifier.entity';

export class ModifierManager<TCard extends ModifierTarget> {
  private _modifiers: Modifier<TCard>[] = [];

  constructor(private card: TCard) {}

  has(modifierOrId: string | Modifier<TCard> | Constructor<Modifier<TCard>>) {
    if (modifierOrId instanceof Modifier) {
      return this._modifiers.some(modifier => modifier.equals(modifierOrId));
    } else if (isString(modifierOrId)) {
      return this._modifiers.some(modifier =>
        modifier.equals({ id: modifierOrId } as Modifier<TCard>)
      );
    } else {
      return this._modifiers.some(modifier => modifier.constructor === modifierOrId);
    }
  }

  get(modifierOrId: string | Modifier<TCard> | Constructor<Modifier<TCard>>) {
    if (modifierOrId instanceof Modifier) {
      return this._modifiers.find(modifier => modifier.equals(modifierOrId));
    } else if (isString(modifierOrId)) {
      return this._modifiers.find(modifier =>
        modifier.equals({ id: modifierOrId } as Modifier<TCard>)
      );
    } else {
      return this._modifiers.find(modifier => modifier.constructor === modifierOrId);
    }
  }

  add(modifier: Modifier<TCard>) {
    if (this.has(modifier)) {
      this.get(modifier.id)!.reapplyTo(this.card, modifier.stacks);
    } else {
      this._modifiers.push(modifier);
      modifier.applyTo(this.card);
    }
  }

  remove(modifierOrId: string | Modifier<TCard> | Constructor<Modifier<TCard>>) {
    const idx = this._modifiers.findIndex(mod => {
      if (modifierOrId instanceof Modifier) {
        return mod.equals(modifierOrId);
      } else if (isString(modifierOrId)) {
        return modifierOrId === mod.id;
      } else {
        return mod.constructor === modifierOrId;
      }
    });
    if (idx < 0) return;

    const [modifier] = this._modifiers.splice(idx, 1);
    modifier.remove();
  }

  get modifiers() {
    return [...this._modifiers];
  }
}
