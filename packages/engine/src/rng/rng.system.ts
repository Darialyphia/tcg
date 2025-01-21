import { System } from '../system';
import randoomSeed from 'seedrandom';

export type RngSystemOptions = { seed: string };
export class RngSystem extends System<RngSystemOptions> {
  private rng!: randoomSeed.PRNG;

  private seed!: string;

  private _values: number[] = [];

  initialize(options: RngSystemOptions) {
    this.seed = options.seed;
    this.rng = randoomSeed(this.seed);
    this.next = this.next.bind(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  shutdown() {}

  next() {
    const val = this.rng();
    this._values.push(val);
    return val;
  }

  nextInt(max: number) {
    return Math.floor(this.next() * (max + 1));
  }
}
