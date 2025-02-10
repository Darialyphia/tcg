import type { AnyFunction, Constructor, Nullable, Prettify, Values } from '@game/shared';
import { type Game } from '../game/game';
import type { DefaultSchema, Input } from './input';
import { System } from '../system';
import type { z } from 'zod';
import {
  GAME_EVENTS,
  GameErrorEvent,
  GameInputQueueFlushedEvent,
  GameInputStartEvent
} from '../game/game.events';

type GenericInputMap = Record<string, Constructor<Input<DefaultSchema>>>;

type ValidatedInputMap<T extends GenericInputMap> = {
  [Name in keyof T & string]: T[Name] extends Constructor<Input<DefaultSchema>>
    ? Name extends InstanceType<T[Name]>['name']
      ? T[Name]
      : `input map mismatch: expected ${Name}, but Input name is ${InstanceType<T[Name]>['name']}`
    : `input type mismatch: expected Input constructor`;
};

const validateinputMap = <T extends GenericInputMap>(data: ValidatedInputMap<T>) => data;

const inputMap = validateinputMap({});

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
      this.game.emit('game.input-queue-flushed', new GameInputQueueFlushedEvent({}));
    } catch (err) {
      this.game.emit('game.error', new GameErrorEvent({ error: err as Error }));
    }
  }

  dispatch(input: SerializedInput) {
    // this.log(input);
    if (!this.isActionType(input.type)) return;
    return this.schedule(() => this.handleInput(input));
  }

  handleInput(input: SerializedInput) {
    if (!this.isActionType(input.type)) return;
    const ctor = inputMap[input.type];
    const inputInst = new ctor(this.game, input.payload);
    this._currentAction = inputInst;
    this.game.emit(
      GAME_EVENTS.INPUT_START,
      new GameInputStartEvent({ input: inputInst })
    );

    inputInst.execute();
    this.history.push(inputInst);
    this._currentAction = null;
  }

  getHistory() {
    return [...this.history];
  }

  serialize() {
    return this.history.map(action => action.serialize()) as SerializedInput[];
  }
}
