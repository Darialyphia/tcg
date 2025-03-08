export class NotEnoughManaError extends Error {
  constructor() {
    super('Not enough mana');
  }
}

export class AllCreaturesSlotsOccupiedError extends Error {
  constructor() {
    super('All creatures slots are occupied');
  }
}

export class CardNotFoundError extends Error {
  constructor() {
    super('Card not found');
  }
}

export class NonBurstSpellPlayedDuringOpponentTurnError extends Error {
  constructor() {
    super("Non-burst spell played during opponent's turn");
  }
}

export class PlayedSpellWithoutChainDuringOpponentTurnError extends Error {
  constructor() {
    super("Played spell without chain during opponent's turn");
  }
}

export class IllegalSpellTypePlayedError extends Error {
  constructor() {
    super('Non-burst spells cannot used in an effect chain');
  }
}
