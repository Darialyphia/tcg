import type { AnyObject } from '@game/shared';
import type { inferInterceptor, Interceptable } from './utils/interceptable';
import { TypedEvent, TypedEventEmitter } from './utils/typed-emitter';

export type EmptyEventMap = Record<string, never>;
export type EmptyInterceptables = Record<string, never>;
export type AnyEntity = Entity<AnyObject, AnyObject>;

class InterceptableEvent extends TypedEvent<{ key: string }, { key: string }> {
  constructor(payload: { key: string }) {
    super(payload);
  }

  serialize(): { key: string } {
    return this.data;
  }
}

type InterceptableEventMap = {
  ADD_INTERCEPTOR: InterceptableEvent;
  REMOVE_INTERCEPTOR: InterceptableEvent;
};

export abstract class Entity<
  TE extends Record<string, any>,
  TI extends Record<string, Interceptable<any>>
> {
  readonly id: string;

  protected readonly emitter = new TypedEventEmitter<TE & InterceptableEventMap>();

  protected interceptors: TI;

  constructor(id: string, interceptables: TI) {
    this.id = id;
    this.interceptors = interceptables;
  }

  get on() {
    return this.emitter.on.bind(this.emitter);
  }

  get once() {
    return this.emitter.once.bind(this.emitter);
  }

  get off() {
    return this.emitter.off.bind(this.emitter);
  }

  equals(e: AnyEntity) {
    return this.id == e.id;
  }

  addInterceptor<T extends keyof TI>(
    key: T,
    interceptor: inferInterceptor<TI[T]>,
    priority?: number
  ) {
    this.interceptors[key].add(interceptor, priority);

    return () => this.removeInterceptor(key, interceptor);
  }

  removeInterceptor<T extends keyof TI>(key: T, interceptor: inferInterceptor<TI[T]>) {
    this.interceptors[key].remove(interceptor);
  }

  shutdown() {
    this.emitter.removeAllListeners();
  }
}
