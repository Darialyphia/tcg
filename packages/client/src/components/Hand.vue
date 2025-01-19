<script setup lang="ts">
import { type Player } from '@/stores/game.store';
import HandCard from './HandCard.vue';

const { player } = defineProps<{
  player: Player;
}>();

const cardSpacing = ref(0);
const root = useTemplateRef('root');

const computeMargin = () => {
  if (!root.value) return 0;
  if (!player.hand.length) return 0;

  const allowedWidth = root.value.clientWidth;
  const totalWidth = [...root.value.children].reduce((total, child) => {
    return total + child.clientWidth;
  }, 0);
  const excess = totalWidth - allowedWidth;

  return Math.min(-excess / (player.hand.length - 1), 0);
};

watch(
  [root, computed(() => player.hand.length)],
  async () => {
    await nextTick();
    cardSpacing.value = computeMargin();
  },
  { immediate: true }
);
</script>

<template>
  <div ref="root" class="hand">
    <div
      v-for="card in player.hand"
      :key="card.id"
      :data-flip-id="card.id"
      class="hand-item"
    >
      <HandCard :card="card" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.hand {
  display: flex;
  transform-style: preserve-3d;
  flex-basis: 50%;
  justify-content: center;
  transform-style: preserve-3d;
  perspective: 800px;
  perspective-origin: center;
  --hand-size: v-bind('player.hand.length');
  /* display: grid;
  align-self: start;
  justify-self: center; */
  > * {
    perspective: 800px;
    perspective-origin: center;
    aspect-ratio: var(--aspect-card);
    z-index: var(--child-index);
    &:hover {
      z-index: calc(var(--hand-size) + 1);
    }
    &:not(:last-child) {
      margin-right: calc(1px * v-bind(cardSpacing));
    }
  }
}
</style>
