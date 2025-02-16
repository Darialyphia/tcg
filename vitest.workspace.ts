import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./packages/client/vite.config.ts",
  "./packages/engine/vitest.config.ts"
])
