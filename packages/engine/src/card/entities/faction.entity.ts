import type { EmptyObject } from '@game/shared';
import { Entity } from '../../entity';

export class Faction extends Entity<EmptyObject, EmptyObject> {
  constructor(
    id: string,
    public readonly name: string
  ) {
    super(id, {});
  }
}
