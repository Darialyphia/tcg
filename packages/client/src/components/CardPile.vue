<script setup lang="ts">
import { type Card } from '@/stores/game.store';
import CardView from './Card.vue';

const { flipped, cards, canInspect } = defineProps<{
  cards: Card[];
  flipped: boolean;
  canInspect: boolean;
}>();

const emit = defineEmits<{ cardClick: [{ card: Card; event: MouseEvent }] }>();
</script>

<template>
  <div class="card-pile" :class="flipped && 'flipped'">
    <div
      v-for="(card, index) in cards"
      :key="card.id"
      :style="{ '--i': index * 0.75 + 'px' }"
      :data-flip-id="card.id"
      @click="emit('cardClick', { event: $event, card })"
    >
      <CardView :card :can-inspect />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.card-pile {
  display: grid;
  aspect-ratio: var(--aspect-card);
  transform-style: preserve-3d;
  > * {
    grid-column: 1;
    grid-row: 1;
    transform-style: preserve-3d;
  }

  .card {
    transition: transform 0.5s var(--ease-3);
    transform: translateZ(var(--i)) rotateY(var(--angle, 0deg));
  }

  &.flipped .card {
    --angle: 180deg;
  }
}
</style>
