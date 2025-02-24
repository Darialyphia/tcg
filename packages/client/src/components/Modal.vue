<script setup lang="ts">
const isOpened = defineModel<boolean>('isOpened', { required: true });
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription
} from 'radix-vue';
const {
  title,
  description,
  closable = true,
  usePortal = true
} = defineProps<{
  title: string;
  description: string;
  closable?: boolean;
  usePortal?: boolean;
}>();
</script>

<template>
  <DialogRoot v-model:open="isOpened" modal>
    <DialogPortal :disabled="!usePortal">
      <Transition appear>
        <DialogOverlay class="modal-overlay" />
      </Transition>

      <Transition appear>
        <DialogContent
          class="modal-content"
          @escape-key-down="
            e => {
              if (!closable) e.preventDefault();
            }
          "
          @focus-outside="
            e => {
              if (!closable) e.preventDefault();
            }
          "
          @interact-outside="
            e => {
              if (!closable) e.preventDefault();
            }
          "
        >
          <DialogTitle class="sr-only">{{ title }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ description }}
          </DialogDescription>
          <slot />
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  z-index: 1;
  inset: 0;

  background-color: hsl(var(--gray-12-hsl) / 0.5);
  backdrop-filter: blur(5px);
  &:focus {
    outline: none;
  }
  &:is(.v-enter-active, .v-leave-active) {
    transition: opacity 0.3s;
  }

  &:is(.v-enter-from, .v-leave-to) {
    opacity: 0;
  }
}

.modal-content {
  position: fixed;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  &:focus,
  &:focus-visible {
    outline: none;
  }
  > * {
    pointer-events: all;
  }

  &:is(.v-enter-active, .v-leave-active) {
    transition:
      transform 0.3s,
      opacity 0.2s 0.1s;
  }

  &.v-enter-from {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }

  &.v-leave-to {
    transform: translate(-50%, calc(-50% - 3rem));
    opacity: 0;
  }
}
</style>
