import type { Nullable } from '@game/shared';
import { defineStore } from 'pinia';
import { Flip } from 'gsap/Flip';

export type CardType =
  | 'creature'
  | 'trap'
  | 'instant_spell'
  | 'row_enchant_spell'
  | 'column_enchant_spell'
  | 'creature_enchant_spell'
  | 'hero_enchant_spell';

export type Card = {
  id: number;
  playerId: string;
  name: string;
  type: CardType;
  isBeingDrawn: boolean;
  isBeingSentToGraveyard: boolean;
  isBeingPlayed: boolean;
  isOnBoard: boolean;
};

export type BoardRow = [
  Nullable<Card>,
  Nullable<Card>,
  Nullable<Card>,
  Nullable<Card>,
  Nullable<Card>
];

type TrapZone = [Nullable<Card>, Nullable<Card>];

export type Player = {
  id: string;
  isUser: boolean;
  deck: Card[];
  hand: Card[];
  graveyard: Card[];
  board: {
    attackZone: BoardRow;
    defenseZone: BoardRow;
    trapZone: TrapZone;
  };
};

type GameState = {
  players: [Player, Player];
  selectedCard: Nullable<Card>;
  inspectedCard: Nullable<Card>;
};

let nextCardId = 0;
const makeCard = (playerId: string, name: string, type: CardType): Card => ({
  id: ++nextCardId,
  name,
  type,
  isBeingDrawn: false,
  isBeingSentToGraveyard: false,
  isBeingPlayed: false,
  isOnBoard: false,
  playerId
});

const isCardType = (type: CardType) => (card: Nullable<Card>) =>
  card?.type === type;
export const isCreature = isCardType('creature');
export const isTrap = isCardType('trap');
export const isRowEnchant = isCardType('row_enchant_spell');
export const isColumnEnchant = isCardType('column_enchant_spell');
export const isHeroEnchant = isCardType('hero_enchant_spell');
export const isCreatureEnchant = isCardType('creature_enchant_spell');
export const isInstantSpell = isCardType('instant_spell');

export const useGame = defineStore('game', () => {
  const state = ref<GameState>({
    selectedCard: null,
    inspectedCard: null,
    players: [
      {
        id: 'P1',
        isUser: false,
        board: {
          attackZone: [null, null, null, null, null],
          defenseZone: [null, null, null, null, null],
          trapZone: [null, null]
        },
        graveyard: [],
        deck: [
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature')
        ],
        hand: [
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature')
        ]
      },
      {
        id: 'P2',
        isUser: true,
        board: {
          attackZone: [null, null, null, null, null],
          defenseZone: [null, null, null, null, null],
          trapZone: [null, null]
        },
        graveyard: [],
        deck: [
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature'),
          makeCard('P1', 'Knight', 'creature')
        ],
        hand: [
          makeCard('P1', 'Ambush', 'trap'),
          makeCard('P2', 'Knight', 'creature'),
          makeCard('P2', 'Knight', 'creature')
        ]
      }
    ]
  });

  const draw = async (e: MouseEvent, player: Player, card: Card) => {
    if (!player.isUser) return;

    const target = e.currentTarget as HTMLElement;
    const state = Flip.getState(target);

    player.deck.splice(player.deck.indexOf(card), 1);
    player.hand.push(card);
    card.isBeingDrawn = true;
    window.requestAnimationFrame(() => {
      Flip.from(state, {
        targets: '.hand-item',
        duration: 0.6,
        ease: Power1.easeOut,
        onComplete() {
          card.isBeingDrawn = false;
        }
      });
    });
  };

  const playCard = (player: Player, card: Card) => {
    player.hand.splice(player.hand.indexOf(card), 1);

    card.isBeingPlayed = true;
    state.value.selectedCard = null;
    const el = document.querySelector('#dragged-card .card');
    if (!el) return;

    const flipState = Flip.getState(el);
    window.requestAnimationFrame(() => {
      Flip.from(flipState, {
        targets: '.board-card',
        duration: 0.4,
        absolute: true,
        ease: Power1.easeOut,
        onComplete() {
          card.isBeingPlayed = false;
        }
      });
    });
  };

  const playCreature = (
    player: Player,
    card: Card,
    zone: 'attack' | 'defense',
    slot: number
  ) => {
    if (zone === 'attack') {
      player.board.attackZone[slot] = card;
    } else if (zone === 'defense') {
      player.board.defenseZone[slot] = card;
    }
    card.isOnBoard = true;
    playCard(player, card);
  };

  const playTrap = (player: Player, card: Card, slot: number) => {
    player.board.trapZone[slot] = card;
    card.isOnBoard = true;
    playCard(player, card);
  };

  const sendToGraveyard = (e: MouseEvent, player: Player, card: Card) => {
    player.hand = player.hand.filter(c => c.id !== card.id);

    player.board.attackZone = player.board.attackZone.map(c =>
      c?.id === card.id ? null : c
    ) as BoardRow;
    player.board.defenseZone = player.board.defenseZone.map(c =>
      c?.id === card.id ? null : c
    ) as BoardRow;
    player.board.trapZone = player.board.trapZone.map(c =>
      c?.id === card.id ? null : c
    ) as TrapZone;

    player.graveyard.push(card);
    const target = e.currentTarget as HTMLElement;
    const state = Flip.getState(target);
    card.isBeingSentToGraveyard = true;

    window.requestAnimationFrame(() => {
      Flip.from(state, {
        targets: '.graveyard .card',
        duration: 0.6,
        absolute: true,
        ease: Power1.easeOut,
        onComplete() {
          card.isBeingSentToGraveyard = false;
        }
      });
    });
  };

  const unselectCard = () => {
    state.value.selectedCard = null;
    const el = document.querySelector('#dragged-card .card');
    if (!el) return;

    const flipState = Flip.getState(el);
    window.requestAnimationFrame(() => {
      Flip.from(flipState, {
        targets: '.hand-card__card',
        duration: 0.4,
        absolute: true,
        ease: Power1.easeOut
      });
    });
  };

  const selectCard = (card: Card) => {
    state.value.selectedCard = card;
  };

  const inspectCard = (element: HTMLElement, card: Card) => {
    state.value.inspectedCard = card;

    const flipState = Flip.getState(element);
    window.requestAnimationFrame(() => {
      Flip.from(flipState, {
        targets: '#inspected-card .card',
        duration: 0.4,
        absolute: true,
        ease: Power3.easeOut,
        onComplete() {
          card.isBeingPlayed = false;
        }
      });
    });
  };

  const uninspectCard = () => {
    const card = state.value.inspectedCard!;
    state.value.inspectedCard = null;

    const el = document.querySelector(`[data-flip-id="card_${card.id}"]`);
    const flipState = Flip.getState(el);

    window.requestAnimationFrame(() => {
      Flip.from(flipState, {
        targets: ['.board-card', '.hand-card__card'],
        duration: 0.4,
        absolute: true,
        ease: Power1.easeOut
      });
    });
  };

  const moveCreature = (
    player: Player,
    to: number,
    zone: 'attack' | 'defense'
  ) => {
    if (zone === 'attack') {
      const from = player.board.attackZone.findIndex(
        card => card?.id === state.value.selectedCard?.id
      )!;
      const [card] = player.board.attackZone.splice(from, 1);
      player.board.attackZone.splice(to, 0, card);
    } else {
      const from = player.board.attackZone.findIndex(
        card => card?.id === state.value.selectedCard?.id
      )!;
      const [card] = player.board.defenseZone.splice(from, 1);
      player.board.defenseZone.splice(to, 0, card);
    }

    const el = document.querySelector(
      `[data-flip-id="card_${state.value.selectedCard!.id}"]`
    );
    state.value.selectedCard = null;
    if (!el) return;

    const flipState = Flip.getState(el);
    window.requestAnimationFrame(() => {
      Flip.from(flipState, {
        targets: '.board-card',
        duration: 0.4,
        absolute: true,
        ease: Power1.easeOut
      });
    });
  };

  return {
    state,
    draw,
    sendToGraveyard,
    selectCard,
    unselectCard,
    inspectCard,
    uninspectCard,
    playCreature,
    playTrap,
    moveCreature,
    getPlayerById(id: string) {
      return state.value.players.find(p => p.id === id)!;
    }
  };
});
