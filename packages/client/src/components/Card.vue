<script setup lang="ts">
import { useGame, type Card } from '@/stores/game.store';
import { nanoid } from 'nanoid';

defineOptions({
  inheritAttrs: false
});
const { card, canInspect } = defineProps<{ card: Card; canInspect: boolean }>();
const game = useGame();

const attrs = useAttrs();

const internalId = nanoid(4);
</script>

<template>
  <Teleport
    to="#inspected-card"
    v-if="canInspect && game.state.inspectedCard?.id === card.id"
    defer
  >
    <div class="card" v-bind="attrs" :data-flip-id="`card_${card.id}`">
      <div
        class="card-inner"
        :class="[
          card.type,
          {
            'is-selected': game.state.selectedCard?.id === card.id,
            'is-on-board': card.isOnBoard,
            'is-being-drawn': card.isBeingDrawn,
            'is-being-sent-to-graveyard': card.isBeingSentToGraveyard,
            'is-being-played': card.isBeingPlayed
          }
        ]"
        @contextmenu.prevent="
          $event => {
            if (canInspect)
              game.inspectCard(
                ($event.currentTarget! as HTMLElement).parentElement!,
                card
              );
          }
        "
      >
        <div class="front">
          {{ card.id }}
          {{ internalId }}
          <div class="type">{{ card.type }}</div>
        </div>
        <div class="back" />
      </div>
    </div>
  </Teleport>

  <div v-else class="card" v-bind="attrs" :data-flip-id="`card_${card.id}`">
    <div
      class="card-inner"
      :class="[
        card.type,
        {
          'is-being-drawn': card.isBeingDrawn,
          'is-being-sent-to-graveyard': card.isBeingSentToGraveyard,
          'is-being-played': card.isBeingPlayed
        }
      ]"
      @contextmenu.prevent="
        $event => {
          if (canInspect)
            game.inspectCard(
              ($event.currentTarget! as HTMLElement).parentElement!,
              card
            );
        }
      "
    >
      <div class="front">
        {{ card.id }}
        {{ internalId }}
        <div class="type">{{ card.type }}</div>
      </div>
      <div class="back" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.card {
  transform-style: preserve-3d;
}

.card-inner {
  aspect-ratio: var(--aspect-card);
  border-radius: var(--radius-2);
  display: grid;
  transform-style: preserve-3d;
  > * {
    grid-column: 1;
    grid-row: 1;
  }
}

.front {
  background: url('/resources/card-front.png');
  background-size: cover;
  border-radius: inherit;
  backface-visibility: hidden;

  display: grid;
  grid-template-rows: 1fr 1fr;
  font-size: var(--font-size-0);
  text-shadow: 0 0 0.25rem black;
}

.back {
  background: url('/resources/card-back.png');
  background-size: cover;
  border-radius: inherit;
  transform: rotateY(0.5turn);
  backface-visibility: hidden;
}

.name {
  padding: var(--size-) var(--size-2);
  margin: var(--size-2);
  text-align: center;
  align-self: start;
}

.type {
  align-self: end;
  text-align: center;
}

@keyframes card-half-flip {
  from {
    transform: rotateY(180deg);
  }
  to {
    transform: none;
  }
}
.is-being-drawn {
  animation: card-half-flip 0.5s ease-out;
  :has(> &) {
    transform-style: preserve-3d;
    perspective: 800px;
    perspective-origin: center;
  }
}

@keyframes card-flip-horizontal {
  from {
    transform: translateZ(0) rotateY(-360deg);
  }
  50% {
    transform: translateZ(70px) rotateY(-180deg);
  }
  75% {
    transform: translateZ(40px) rotateY(-0deg);
  }
  to {
    transform: translateZ(0);
  }
}

@keyframes card-flip-vertical {
  from {
    transform: translateZ(0) rotateX(360deg);
  }
  50% {
    transform: translateZ(70px) rotateX(0deg);
  }

  to {
    transform: translate(0);
  }
}

.is-being-sent-to-graveyard {
  &.creature {
    animation: card-flip-horizontal 0.6s linear;
  }

  &.trap {
    animation: card-flip-vertical 0.6s linear;
  }
  :has(> &) {
    transform-style: preserve-3d;
    perspective: 800px;
    perspective-origin: center;
  }
}

.is-on-board {
  transition: transform 0.3s var(--ease-out-3);
  &.is-selected {
    &.creature {
      transform: translateZ(20px);
    }
  }
}
</style>
