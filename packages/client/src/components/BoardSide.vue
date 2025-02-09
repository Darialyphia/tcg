<script setup lang="ts">
import { Teleport } from 'vue';
import {
  isCreature,
  isCreatureEnchant,
  isRowEnchant,
  isTrap,
  useGame,
  type BoardRow,
  type Card,
  type Player
} from '@/stores/game.store';
import Deck from './Deck.vue';
import CardView from './Card.vue';
import CardDropZone from './CardDropZone.vue';
import Graveyard from './Graveyard.vue';
import { isDefined, type Nullable } from '@game/shared';
import Tooltip from './Tooltip.vue';
import { usePageLeave } from '@vueuse/core';

const { player } = defineProps<{
  player: Player;
}>();

const enchantSide = computed(() => (player.isUser ? 'right' : 'left'));

const game = useGame();

const myPlayer = game.state.players.find(p => p.isUser)!;

const onDropCreature = (index: number, zone: 'attack' | 'defense') => {
  const card = game.state.selectedCard!;
  if (card.isOnBoard) {
    game.moveCreature(player, index, zone);
  } else {
    game.playCreature(player, game.state.selectedCard!, zone, index);
  }
};

const canDropCreature = (zone: BoardRow, index: number) => {
  return (
    isCreatureEnchant(game.state.selectedCard) ||
    (isCreature(game.state.selectedCard) &&
      player.id === myPlayer.id &&
      !isDefined(zone[index]))
  );
};

const isOutOfScreen = usePageLeave();

const isSelected = (card: Nullable<Card>) =>
  game.state.selectedCard?.id === card?.id;

const onCreatureMousedown = (e: MouseEvent, card: Card) => {
  if (e.button !== 0) return;

  game.selectCard(card);
  const stopDragging = () => {
    game.unselectCard();

    document.body.removeEventListener('mouseup', onMouseup);
  };
  const onMouseup = () => {
    stopDragging();
  };

  document.body.addEventListener('mouseup', onMouseup);
  const unwatch = watchEffect(() => {
    if (isOutOfScreen.value) {
      stopDragging();
      game.state.selectedCard = null;
      unwatch();
    }
  });
};
</script>

<template>
  <div class="board-side" :class="`enchants-${enchantSide}`">
    <div class="left">
      <Tooltip text="Hero enchants zone">
        <div></div>
      </Tooltip>
      <Tooltip text="Hero zone">
        <div class="card-zone hero"></div>
      </Tooltip>
    </div>

    <div class="middle">
      <div class="creature-row">
        <div class="row-enchants drop-zone">
          <Tooltip text="Row enchants">
            <CardDropZone :is-enabled="isRowEnchant(game.state.selectedCard)" />
          </Tooltip>
        </div>

        <div
          class="card-zone drop-zone"
          v-for="(card, index) in player.board.attackZone"
          :key="index"
        >
          <Tooltip :text="`Attack zone slot ${index + 1}`">
            <CardDropZone
              :is-enabled="canDropCreature(player.board.attackZone, index)"
              @drop="onDropCreature(index, 'attack')"
            />
          </Tooltip>

          <component
            v-if="card"
            :is="game.state.selectedCard?.id === card.id ? Teleport : 'div'"
            to="#dragged-card"
          >
            <CardView
              :card
              class="board-card"
              can-inspect
              @mousedown="onCreatureMousedown($event, card)"
              @dblclick="game.sendToGraveyard($event, player, card)"
            />
          </component>
        </div>
      </div>

      <div class="creature-row">
        <div class="row-enchants drop-zone">
          <Tooltip text="Row enchants">
            <CardDropZone :is-enabled="isRowEnchant(game.state.selectedCard)" />
          </Tooltip>
        </div>

        <div
          class="card-zone drop-zone"
          v-for="(card, index) in player.board.defenseZone"
          :key="index"
        >
          <Tooltip :text="`Defense zone slot ${index + 1}`">
            <CardDropZone
              :is-enabled="canDropCreature(player.board.defenseZone, index)"
              @drop="onDropCreature(index, 'defense')"
            />
          </Tooltip>

          <component
            v-if="card"
            :is="game.state.selectedCard?.id === card.id ? Teleport : 'div'"
            to="#dragged-card"
          >
            <CardView
              :card
              class="board-card"
              can-inspect
              @mousedown="onCreatureMousedown($event, card)"
              @dblclick="game.sendToGraveyard($event, player, card)"
            />
          </component>
        </div>
      </div>
    </div>

    <div class="right">
      <div class="traps">
        <div
          class="card-zone drop-zone"
          v-for="(card, index) in player.board.trapZone"
          :key="index"
        >
          <Tooltip :text="`Trap zone slot ${index + 1}`">
            <CardDropZone
              :is-enabled="
                isTrap(game.state.selectedCard) &&
                player.id === myPlayer.id &&
                !isDefined(player.board.trapZone[index])
              "
              @drop="game.playTrap(player, game.state.selectedCard!, index)"
            />
          </Tooltip>
          <component
            v-if="card"
            :is="isSelected(card) ? Teleport : 'div'"
            to="#dragged-card"
            defer
          >
            <CardView
              :card
              class="board-card"
              can-inspect
              @dblclick="game.sendToGraveyard($event, player, card)"
            />
          </component>
        </div>
      </div>
      <Tooltip text="Deck">
        <div class="card-zone deck-zone">
          <Deck :player-id="player.id" />
        </div>
      </Tooltip>
      <Tooltip text="Graveyard">
        <div class="card-zone"><Graveyard :player-id="player.id" /></div>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.board-side {
  display: grid;
  grid-template-columns: subgrid;
  gap: var(--size-3);
  transform-style: preserve-3d;

  * {
    transform-style: preserve-3d;
  }
}

.left {
  display: grid;
  grid-template-rows: 0.25fr 0.75fr;
  gap: var(--size-3);

  > * {
    padding: var(--size-1);
  }
}

.middle {
  display: grid;
  grid-template-rows: 1fr 1fr;
}

.hero {
  justify-self: center;
}

.card-zone {
  aspect-ratio: var(--aspect-card);
}

.drop-zone {
  display: grid;
  > * {
    grid-column: 1;
    grid-row: 1;
  }
}

.creature-row {
  padding: var(--size-3) var(--size-5);
  display: grid;
  /* justify-self: center; */
  align-items: center;
  column-gap: var(--size-6);

  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: auto 1fr;

  .card-zone,
  .row-enchants {
    grid-row: 2;

    &:has(.is-being-played) {
      z-index: 1;
    }
  }
  .label {
    grid-row: 1;
    grid-column: 1 / span 6;
  }
}

.row-enchants {
  align-self: center;
  height: 70%;
  .board-side.enchants-left & {
    grid-column: 1;
  }

  .board-side.enchants-right & {
    grid-column: 6;
  }
}

.right {
  padding: var(--size-2);
  display: grid;
  gap: var(--size-3);
  grid-template-columns: 1fr 1fr;

  > .card-zone {
    padding: var(--size-2);
  }
}

.traps {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: auto 1fr;
  padding: var(--size-3);
  gap: var(--size-3);
}
</style>
