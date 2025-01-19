<script setup lang="ts">
const { isEnabled } = defineProps<{ isEnabled: boolean }>();

const emit = defineEmits<{ drop: [] }>();
</script>

<template>
  <div
    class="card-drop-zone"
    :class="isEnabled && 'is-enabled'"
    @mouseup="
      e => {
        if (isEnabled) {
          e.stopPropagation();
          emit('drop');
        }
      }
    "
  />
</template>

<style scoped lang="postcss">
.card-drop-zone {
  transition:
    background-color 0.2s var(--ease-2),
    box-shadow 0.2s var(--ease-2);
  &.is-enabled {
    background-color: #d7ad4288;
    &:hover {
      box-shadow: 0 0 1.25rem hsl(43 65% 55% / 0.75);
    }
  }
}
</style>
