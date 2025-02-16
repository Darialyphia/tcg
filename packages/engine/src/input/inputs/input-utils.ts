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
