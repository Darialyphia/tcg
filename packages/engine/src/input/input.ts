import { z } from 'zod';
import { assert, type JSONValue, type Serializable } from '@game/shared';
import type { Game } from '../game/game';
import type { GamePhase } from '../game/systems/game-phase.system';

export const defaultInputSchema = z.object({
  playerId: z.string()
});
export type DefaultSchema = typeof defaultInputSchema;

export type AnyGameAction = Input<any>;

export abstract class Input<TSchema extends DefaultSchema>
  implements Serializable<{ type: string; payload: z.infer<TSchema> }>
{
  abstract readonly allowedPhases: GamePhase[];

  abstract readonly name: string;

  protected abstract payloadSchema: TSchema;

  protected payload!: z.infer<TSchema>;

  constructor(
    protected game: Game,
    protected rawPayload: JSONValue
  ) {}

  protected abstract impl(): void;

  private parsePayload() {
    const parsed = this.payloadSchema.safeParse(this.rawPayload);
    assert(parsed.success, parsed.error?.message);

    this.payload = parsed.data;
  }

  get player() {
    return this.game.playerSystem.getPlayerById(this.payload.playerId)!;
  }

  get isValidPhase() {
    return this.allowedPhases.includes(this.game.phase);
  }

  execute() {
    this.parsePayload();

    assert(this.payload, 'input payload is required');
    assert(this.player, `Unknown player id: ${this.payload.playerId}`);
    assert(
      this.isValidPhase,
      `Cannot execute input ${this.name} during game phase ${this.game.phase}`
    );

    this.impl();
  }

  serialize() {
    return {
      type: this.name,
      payload: this.payload
    };
  }
}
