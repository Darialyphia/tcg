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
