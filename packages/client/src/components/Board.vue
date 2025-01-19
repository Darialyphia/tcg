<script setup lang="ts">
import { isColumnEnchant, useGame } from '@/stores/game.store';
import BoardSide from './BoardSide.vue';
import Hand from './Hand.vue';
import DraggedCard from './DraggedCard.vue';
import CardDropZone from './CardDropZone.vue';
import InspectedCard from './InspectedCard.vue';
import Tooltip from './Tooltip.vue';

const game = useGame();
</script>

<template>
  <div id="board-root">
    <div class="wrapper-3d">
      <div class="board">
        <BoardSide :player="game.state.players[0]" class="player opponent" />
        <div class="row-enchants">
          <div class="card-flipped drop-zone">
            <Tooltip text="Column Enchants">
              <CardDropZone
                :is-enabled="isColumnEnchant(game.state.selectedCard)"
              />
            </Tooltip>
          </div>
          <div class="card-flipped drop-zone">
            <Tooltip text="Column Enchants">
              <CardDropZone
                :is-enabled="isColumnEnchant(game.state.selectedCard)"
              />
            </Tooltip>
          </div>
          <div class="card-flipped drop-zone">
            <Tooltip text="Column Enchants">
              <CardDropZone
                :is-enabled="isColumnEnchant(game.state.selectedCard)"
              />
            </Tooltip>
          </div>
          <div class="card-flipped drop-zone">
            <Tooltip text="Column Enchants">
              <CardDropZone
                :is-enabled="isColumnEnchant(game.state.selectedCard)"
              />
            </Tooltip>
          </div>
          <div class="card-flipped drop-zone">
            <Tooltip text="Column Enchants">
              <CardDropZone
                :is-enabled="isColumnEnchant(game.state.selectedCard)"
              />
            </Tooltip>
          </div>
        </div>
        <BoardSide :player="game.state.players[1]" class="player" />
      </div>
    </div>
    <Hand class="hand" :player="game.state.players[1]" />
    <DraggedCard />
    <InspectedCard />
  </div>
</template>

<style scoped lang="postcss">
.wrapper-3d {
  transform-style: preserve-3d;
  perspective: 900px;
  perspective-origin: center bottom;
}

.board {
  background-image: url('/resources/board-bg.png');
  background-size: contain;
  /* height: 100dvh; */
  margin-inline: auto;
  width: 65vw;
  aspect-ratio: 1248 / 911;
  transform-style: preserve-3d;
  transform: rotateX(var(--board-rotate-x)) translateY(-180px);
  display: grid;
  align-content: center;
  grid-template-columns: 0.26fr 0.73fr 0.26fr;
  grid-template-rows: auto auto auto;
  gap: var(--size-3);
}

.player {
  grid-column: 1 / -1;
  &:not(.opponent) {
    align-self: end;
  }
}

.row-enchants {
  grid-column: 2;
  display: grid;
  height: 6rem;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--size-4);
  padding: var(--size-2);
}

.drop-zone {
  display: grid;
  > * {
    grid-column: 1;
    grid-row: 1;
  }
}

.opponent {
  transform: rotateZ(180deg);
}

.hand {
  position: fixed;
  bottom: 0;
  height: 25dvh;
  width: 50vw;
  left: 50%;
  transform: translateX(-50%);
}
</style>
