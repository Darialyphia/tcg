<script setup lang="ts">
import type { Card } from '@/stores/game.store';
import CardView from './Card.vue';

const { cards } = defineProps<{ cards: Card[] }>();

const root = useTemplateRef('root');
</script>

<template>
  <div class="spread-pile" ref="root">
    <div
      v-for="(card, index) in cards"
      :key="card.id"
      class="wrapper"
      :style="{ '--i': index }"
    >
      <CardView :card can-inspect />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.spread-pile {
  --size: v-bind('cards.length');
  display: flex;
  transform-style: preserve-3d;
  perspective: 800px;
  perspective-origin: center;
  justify-content: center;
}

.wrapper {
  width: 10rem;
  aspect-ratio: var(--aspect-card);
  display: grid;
  transition:
    transform 0.3s var(--ease-out-2),
    z-index 0.3s var(--ease-out-2);
  &:not(:last-child) {
    margin-right: calc(-10px * var(--size));
  }

  &:hover {
    position: relative;
    z-index: calc(var(--size) + 1);
    transform: scale(1.15);
  }
}
</style>
