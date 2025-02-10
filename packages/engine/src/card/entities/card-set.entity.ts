import type { EmptyObject, Serializable } from '@game/shared';
import { Entity } from '../../entity';
import type { CardBlueprint } from '../card-blueprint';

export type SerializedCardSet = {
  id: string;
  name: string;
};

export class CardSet
  extends Entity<EmptyObject, EmptyObject>
  implements Serializable<{ id: string; name: string }>
{
  constructor(
    id: string,
    public readonly name: string,
    public cards: CardBlueprint[]
  ) {
    super(id, {});
  }

  serialize(): { id: string; name: string } {
    return {
      id: this.id,
      name: this.name
    };
  }
}
