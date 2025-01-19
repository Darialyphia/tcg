<script setup lang="ts">
import { useGame } from '@/stores/game.store';
import CardPile from './CardPile.vue';

const { playerId } = defineProps<{
  playerId: string;
}>();

const game = useGame();
const player = computed(() => game.getPlayerById(playerId));
</script>

<template>
  <CardPile
    :cards="player.deck"
    flipped
    :can-inspect="false"
    @card-click="game.draw($event.event, player, $event.card)"
  />
</template>
