<script setup lang="ts">
import {
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
  type TooltipContentProps
} from 'radix-vue';

export type UITooltipProps = {
  sideOffset?: number;
  delay?: number;
  side?: TooltipContentProps['side'];
  align?: TooltipContentProps['align'];
  usePortal?: boolean;
  text?: string;
};

const {
  sideOffset = 10,
  side,
  align,
  usePortal = true,
  text
} = defineProps<UITooltipProps>();
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger v-slot="triggerProps" as-child>
      <slot v-bind="triggerProps" />
    </TooltipTrigger>
    <TooltipPortal :disabled="!usePortal">
      <TooltipContent
        v-slot="contentProps"
        class="select-none"
        :side-offset="sideOffset"
        :side="side"
        :align="align"
      >
        <div class="tooltip-content">
          <slot name="text" v-bind="contentProps">
            {{ text }}
          </slot>
          <TooltipArrow class="tooltip-arrow" :width="12" />
        </div>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<style lang="postcss" scoped>
.tooltip-content {
  background-color: var(--surface-1);
  color: white;
  padding: var(--size-3);
  font-family: var(--font-system-ui);
  font-size: 14px;
  border: solid 1px #bb8225;
  max-width: 40ch;
  transform-origin: var(--radix-tooltip-content-transform-origin);
  animation: tooltip 0.2s var(--ease-out-2);
}

:global(.tooltip-arrow) {
  fill: var(--surface-1);
  stroke: #bb8225;
  stroke-width: 2px;
  transform: translateY(-1px);
}
@keyframes tooltip {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
