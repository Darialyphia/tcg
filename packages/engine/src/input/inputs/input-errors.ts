export class NotActivePlayerError extends Error {
  constructor() {
    super('You are not the active player');
  }
}

export class AlreadyPerformedManaActionError extends Error {
  constructor() {
    super(
      'A card has already been put in mana zone or a shard has already been played this turn'
    );
  }
}

export class WrongGamePhaseError extends Error {
  constructor() {
    super('Wrong game phase');
  }
}

export class NoPayloadError extends Error {
  constructor() {
    super('Input payload is required');
  }
}

export class UnknownPlayerError extends Error {
  constructor(playerId: string) {
    super(`Unknown player id: ${playerId}`);
  }
}
