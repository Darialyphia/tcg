<script setup lang="ts">
import { Teleport } from 'vue';
import CardView from './Card.vue';
import { usePageLeave } from '@vueuse/core';
import { useGame, type Card } from '@/stores/game.store';

const { card } = defineProps<{ card: Card }>();

const isOutOfScreen = usePageLeave();
const cardRef = useTemplateRef('cardRef');

const game = useGame();
const isSelected = computed(() => game.state.selectedCard?.id === card.id);
const onMouseDown = (e: MouseEvent) => {
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
  <div
    class="hand-card"
    :class="{
      hoverable: !game.state.selectedCard
    }"
    @mousedown="onMouseDown"
  >
    <component :is="isSelected ? Teleport : 'div'" to="#dragged-card">
      <CardView
        ref="cardRef"
        :card="card"
        class="hand-card__card"
        :class="{
          'is-dragging': isSelected
        }"
        can-inspect
      />
    </component>
  </div>
</template>

<style scoped lang="postcss">
.hand-card {
  position: relative;
  transform-origin: bottom right;
  transform-style: preserve-3d;
  perspective: 800px;
  perspective-origin: center;
  aspect-ratio: var(--aspect-card);
  transition:
    transform 0.3s var(--ease-out-2),
    margin 0.3s var(--ease-out-2),
    z-index 0.15s var(--ease-in-4);

  &.hoverable&:hover {
    transform: scale(1.25) translateY(-10px);
    &.is-shaking {
      animation: var(--animation-shake-x);
      animation-duration: 0.3s;
    }
  }
}

.is-dragging {
  transform-origin: top left;
  width: 140px;
  transform: translateZ(30px);
}
</style>
