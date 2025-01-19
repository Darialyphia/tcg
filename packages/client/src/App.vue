<script setup lang="ts">
import { TooltipProvider } from 'radix-vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <TooltipProvider>
    <RouterView />
  </TooltipProvider>
</template>
