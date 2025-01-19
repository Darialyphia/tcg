<script setup lang="ts">
import { useGame } from '@/stores/game.store';
import { onClickOutside } from '@vueuse/core';
import { isDefined } from '@game/shared';

const wrapper = useTemplateRef('wrapper');

const game = useGame();

onClickOutside(
  wrapper,
  () => {
    game.uninspectCard();
  },
  {
    ignore: ['#__vue-devtools-container__', '#vue-inspector-container']
  }
);
</script>

<template>
  <Transition>
    <div
      id="inspected-card-container"
      v-if="isDefined(game.state.inspectedCard)"
    >
      <div ref="wrapper" id="inspected-card"></div>
    </div>
  </Transition>
</template>

<style lang="postcss">
#inspected-card-container {
  perspective: 800px;
  position: fixed;
  inset: 0;
  display: grid;
  place-content: center;
  z-index: 2;
  backdrop-filter: blur(5px);
  background-color: hsl(0 0 0 / 0.25);

  &:is(.v-enter-active, .v-leave-active) {
    transition: all 0.2s var(--ease-out-2);
  }

  &:is(.v-enter-from, .v-leave-to) {
    background-color: transparent;
    backdrop-filter: none;
  }
}

#inspected-card {
  width: 20rem;
  aspect-ratio: var(--aspect-card);
  > * {
    width: 100%;
    height: 100%;
  }
}
</style>
