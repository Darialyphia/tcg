<script setup lang="ts">
import { useGame } from '@/stores/game.store';
import CardPile from './CardPile.vue';
import Modal from './Modal.vue';
import SpreadPile from './SpreadPile.vue';

const { playerId } = defineProps<{
  playerId: string;
}>();

const game = useGame();
const player = computed(() => game.getPlayerById(playerId));

const isDetailsOpened = ref(false);
</script>

<template>
  <CardPile
    :cards="player.graveyard"
    :flipped="false"
    class="graveyard"
    :can-inspect="false"
    @click="isDetailsOpened = true"
  />
  <Teleport to="#board-root" defer>
    <Modal
      v-model:is-opened="isDetailsOpened"
      title="Graveyard"
      description="The content of the graveyard"
    >
      <div ref="details">
        <SpreadPile :cards="player.graveyard" />
      </div>
    </Modal>
  </Teleport>
</template>

<style scoped lang="postcss">
.graveyard-details {
  perspective: 800px;
  position: fixed;
  inset: 0;
  display: grid;
  place-content: center;
  z-index: 1;
  backdrop-filter: blur(5px);
  background-color: hsl(0 0 0 / 0.25);

  &:is(.v-enter-active, .v-leave-active) {
    transition: all 0.2s var(--ease-out-2);
    > * {
      transition: all 0.2s var(--ease-out-2);
    }
  }

  &:is(.v-enter-from, .v-leave-to) {
    background-color: transparent;
    backdrop-filter: none;
    > * {
      opacity: 0;
      transform: translateX(var(--size-5));
    }
  }

  > * {
    height: 10rem;
    max-width: 50vw;
    display: grid;
    > * {
      height: 100%;
    }
  }
}
</style>
