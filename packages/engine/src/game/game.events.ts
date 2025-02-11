import type { EmptyObject, Prettify, Values } from '@game/shared';
import type { SerializedInput } from '../input/input-system';
import { TypedEvent } from '../utils/typed-emitter';
import type { Input } from '../input/input';
import { TURN_EVENTS, type TurnEventMap } from './turn-system';
import type { PlayerEventMap } from '../player/player.events';
import type { Player, SerializedPlayer } from '../player/player.entity';
import { mapKeys, mapValues } from 'lodash-es';
import { PLAYER_EVENTS } from '../player/player-enums';
import type {
  CreatureEventMap,
  EvolutionEventMap,
  HeroEventMap,
  ShardEventMap,
  SpellEventMap
} from '../card/card.events';
import type { AnyCard } from '../card/entities/card.entity';
import type { Creature, SerializedCreature } from '../card/entities/creature.entity';
import type { Evolution, SerializedEvolution } from '../card/entities/evolution.entity';
import type { Hero, SerializedHero } from '../card/entities/hero.entity';
import type { SerializedSpell, Spell } from '../card/entities/spell.entity';
import type { SerializedShard, Shard } from '../card/entities/shard.entity';

type GameCardEventMap<TCard extends AnyCard> = TCard extends Creature
  ? CreatureEventMap
  : TCard extends Evolution
    ? EvolutionEventMap
    : TCard extends Hero
      ? HeroEventMap
      : TCard extends Spell
        ? SpellEventMap
        : TCard extends Shard
          ? ShardEventMap
          : `TCard needs to be an instance of Creature, Evolution, Hero, Spell, or Shard`;

type GameCardEventSerialized<TCard extends AnyCard> = TCard extends Creature
  ? SerializedCreature
  : TCard extends Evolution
    ? SerializedEvolution
    : TCard extends Hero
      ? SerializedHero
      : TCard extends Spell
        ? SerializedSpell
        : TCard extends Shard
          ? SerializedShard
          : `TCard needs to be an instance of Creature, Evolution, Hero, Spell, or Shard`;

type GameCardSerializedResult<
  TCard extends AnyCard,
  TMap extends GameCardEventMap<TCard>,
  TEvent extends Values<TMap>
> =
  TEvent extends TypedEvent<any, any>
    ? ReturnType<TEvent['serialize']> & { card: GameCardEventSerialized<TCard> }
    : never;

export class GameCardEvent<
  TCard extends AnyCard,
  TMap extends GameCardEventMap<TCard> = GameCardEventMap<TCard>,
  TEvent extends Values<TMap> = Values<TMap>,
  TSerialized extends GameCardSerializedResult<
    TCard,
    TMap,
    TEvent
  > = GameCardSerializedResult<TCard, TMap, TEvent>
> extends TypedEvent<{ card: TCard; event: TEvent }, TSerialized> {
  serialize() {
    if (!(this.data.event instanceof TypedEvent)) {
      throw new Error('Typescript moment');
    }
    return {
      ...(this.data.event.serialize() as any),
      player: this.data.card.serialize()
    } as TSerialized;
  }
}

export class GamePlayerEvent<TEvent extends Values<PlayerEventMap>> extends TypedEvent<
  { player: Player; event: TEvent },
  ReturnType<TEvent['serialize']> & { player: SerializedPlayer }
> {
  serialize() {
    return {
      ...(this.data.event.serialize() as any),
      player: this.data.player.serialize()
    } as ReturnType<TEvent['serialize']> & { player: SerializedPlayer };
  }
}
export class GameInputStartEvent extends TypedEvent<
  { input: Input<any> },
  SerializedInput
> {
  serialize() {
    return this.data.input.serialize();
  }
}

export class GameInputQueueFlushedEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class GameErrorEvent extends TypedEvent<{ error: Error }, { error: string }> {
  serialize() {
    return { error: this.data.error.message };
  }
}

export class GameReadyEvent extends TypedEvent<EmptyObject, EmptyObject> {
  serialize() {
    return {};
  }
}

export class GameStarEvent<
  T extends Exclude<GameEventName, '*'> = Exclude<GameEventName, '*'>
> extends TypedEvent<{ e: StarEvent<T> }, SerializedStarEvent> {
  get eventName() {
    return this.data.e.eventName;
  }

  get event() {
    return this.data.e.event;
  }

  serialize() {
    return {
      eventName: this.data.e.eventName,
      event: this.data.e.event.serialize()
    } as any;
  }
}

type GameEventsBase = {
  'game.input-start': GameInputStartEvent;
  'game.input-queue-flushed': GameInputQueueFlushedEvent;
  'game.error': GameErrorEvent;
  'game.ready': GameReadyEvent;
  '*': GameStarEvent;
};

type GamePlayerEventMap = {
  [Event in keyof PlayerEventMap as `player.${Event}`]: GamePlayerEvent<
    PlayerEventMap[Event]
  >;
};

type GameCreatureEventMap = {
  [Event in keyof CreatureEventMap as `card.${Event}`]: GameCardEvent<
    Creature,
    CreatureEventMap,
    CreatureEventMap[Event]
  >;
};

type GameEvolutionEventMap = {
  [Event in keyof EvolutionEventMap as `card.${Event}`]: GameCardEvent<
    Evolution,
    EvolutionEventMap,
    EvolutionEventMap[Event]
  >;
};

type GameHeroEventMap = {
  [Event in keyof HeroEventMap as `card.${Event}`]: GameCardEvent<
    Hero,
    HeroEventMap,
    HeroEventMap[Event]
  >;
};

type GameSpellEventMap = {
  [Event in keyof SpellEventMap as `card.${Event}`]: GameCardEvent<Spell, SpellEventMap>;
};
type GameShardEventMap = {
  [Event in keyof ShardEventMap as `card.${Event}`]: GameCardEvent<
    Shard,
    ShardEventMap,
    ShardEventMap[Event]
  >;
};

export type GameEventMap = Prettify<
  GameEventsBase &
    TurnEventMap &
    GamePlayerEventMap &
    GameCreatureEventMap &
    GameEvolutionEventMap &
    GameHeroEventMap &
    GameSpellEventMap &
    GameShardEventMap
>;
export type GameEventName = keyof GameEventMap;
export type GameEvent = Values<GameEventMap>;

export type StarEvent<
  T extends Exclude<GameEventName, '*'> = Exclude<GameEventName, '*'>
> = {
  eventName: T;
  event: GameEventMap[T];
};

export type SerializedStarEvent = Values<{
  [Name in Exclude<GameEventName, '*'>]: {
    eventName: Name;
    event: ReturnType<GameEventMap[Name]['serialize']>;
  };
}>;

const makeGlobalEvents = <TDict extends Record<string, string>, TPrefix extends string>(
  eventDict: TDict,
  prefix: TPrefix
) =>
  mapKeys(
    mapValues(eventDict, evt => `${prefix}.${evt}`),
    (value, key) => `${prefix.toUpperCase()}_${key}`
  ) as {
    [Key in string &
      keyof TDict as `${Uppercase<TPrefix>}_${Key}`]: `${TPrefix}.${TDict[Key]}`;
  };

export const GAME_EVENTS = {
  ERROR: 'game.error',
  READY: 'game.ready',
  FLUSHED: 'game.input-queue-flushed',
  INPUT_START: 'game.input-start',
  TURN_START: TURN_EVENTS.TURN_START,
  TURN_END: TURN_EVENTS.TURN_END,
  ...makeGlobalEvents(PLAYER_EVENTS, 'player')
} as const satisfies Record<string, keyof GameEventMap>;
