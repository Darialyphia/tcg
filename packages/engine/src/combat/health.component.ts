export type HealthComponentOptions = {
  initialValue: number;
};

export const HEALTH_EVENTS = {
  CHANGE: 'CHANGE'
} as const;

export class HealthComponent {
  private _current: number;

  constructor(options: HealthComponentOptions) {
    this._current = options.initialValue;
  }

  get current() {
    return this._current;
  }

  get isDead() {
    return this._current === 0;
  }

  add(amount: number, max: number) {
    this._current = Math.min(this._current + amount, max);
  }

  remove(amount: number) {
    this._current = Math.max(this._current - amount, 0);
  }
}
