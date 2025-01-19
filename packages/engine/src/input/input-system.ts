import type { AnyFunction, Constructor, Nullable, Prettify, Values } from '@game/shared';
import { GAME_EVENTS, type Game } from '../game/game';
import type { DefaultSchema, Input } from './input';
import { MoveInput } from './inputs/move.input';
import { AttackInput } from './inputs/attack.input';
import { PlayCardInput } from './inputs/play-card.input';
import { System } from '../system';
import type { z } from 'zod';
import { EndTurnInput } from './inputs/endTurn.input';
import { GoldResourceActionInput } from './inputs/gold-resource-action.input';
import { DrawResourceActionInput } from './inputs/draw-resource-action.input';
import { RuneResourceActionInput } from './inputs/rune-resource-action';
import { MulliganInput } from './inputs/mulligan.input';

type GenericInputMap = Record<string, Constructor<Input<DefaultSchema>>>;

type ValidatedInputMap<T extends GenericInputMap> = {
  [Name in keyof T & string]: T[Name] extends Constructor<Input<DefaultSchema>>
    ? Name extends InstanceType<T[Name]>['name']
      ? T[Name]
      : `input map mismatch: expected ${Name}, but Input name is ${InstanceType<T[Name]>['name']}`
    : `input type mismatch: expected Input constructor`;
};

const validateinputMap = <T extends GenericInputMap>(data: ValidatedInputMap<T>) => data;

const inputMap = validateinputMap({
  move: MoveInput,
  attack: AttackInput,
  playCard: PlayCardInput,
  endTurn: EndTurnInput,
  mulligan: MulliganInput,
  goldResourceAction: GoldResourceActionInput,
  drawResourceAction: DrawResourceActionInput,
  runeResourceAction: RuneResourceActionInput
});

type InputMap = typeof inputMap;

export type SerializedInput = Prettify<
  Values<{
    [Name in keyof InputMap]: {
      type: Name;
      payload: InstanceType<InputMap[Name]> extends Input<infer Schema>
        ? z.infer<Schema>
        : never;
    };
  }>
>;
export type InputDispatcher = (input: SerializedInput) => void;

export type InputSystemOptions = { game: Game };

export class InputSystem extends System<SerializedInput[]> {
  private history: Input<any>[] = [];

  private isRunning = false;

  private queue: AnyFunction[] = [];

  private _currentAction?: Nullable<InstanceType<Values<typeof inputMap>>> = null;

  get currentAction() {
    return this._currentAction;
  }

  initialize(rawHistory: SerializedInput[]) {
    for (const input of rawHistory) {
      this.schedule(() => this.handleInput(input));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  shutdown() {}

  private isActionType(type: string): type is keyof typeof inputMap {
    return Object.keys(inputMap).includes(type);
  }

  schedule(fn: AnyFunction) {
    this.queue.push(fn);
    if (!this.isRunning) {
      this.flushSchedule();
    }
  }

  private flushSchedule() {
    if (this.isRunning) {
      console.warn('already flushing !');
      return;
    }
    this.isRunning = true;
    try {
      while (this.queue.length) {
        const fn = this.queue.shift();
        fn!();
      }
      this.isRunning = false;
      this.game.emit('game.input-queue-flushed');
    } catch (err) {
      this.game.emit('game.error', { error: err as Error });
    }
  }

  dispatch(input: SerializedInput) {
    // this.log(input);
    if (!this.isActionType(input.type)) return;
    return this.schedule(() => this.handleInput(input));
  }

  handleInput({ type, payload }: SerializedInput) {
    if (!this.isActionType(type)) return;
    const ctor = inputMap[type];
    const input = new ctor(this.game, payload);
    this._currentAction = input;
    this.game.emit(GAME_EVENTS.INPUT_START, { type, payload } as SerializedInput);

    input.execute();
    this.history.push(input);
    this._currentAction = null;
  }

  getHistory() {
    return [...this.history];
  }

  serialize() {
    return this.history.map(action => action.serialize()) as SerializedInput[];
  }
}
