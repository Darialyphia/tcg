import { fileURLToPath, URL } from 'node:url';

import { defineConfig, Plugin, ResolvedConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import vueDevTools from 'vite-plugin-vue-devtools';
import autoImport from 'unplugin-auto-import/vite';
import vueRouter from 'unplugin-vue-router/vite';
import { VueRouterAutoImports } from 'unplugin-vue-router';
import unoCSS from 'unocss/vite';
import icons from 'unplugin-icons/vite';

//@ts-expect-error no types for this package
import assetpackConfig from '@game/assetpack';


import { AssetPack } from '@assetpack/core';

function assetpackPlugin(): Plugin {
  const apConfig = assetpackConfig('./src/assets/', './public/assets/');

  let mode: ResolvedConfig['command'];
  let ap: AssetPack | undefined;

  return {
    name: 'vite-plugin-assetpack',
    configResolved(resolvedConfig) {
      mode = resolvedConfig.command;
    },
    buildStart: async () => {
      if (mode === 'serve') {
        if (ap) return;
        ap = new AssetPack(apConfig);
        void ap.watch();
      } else {
        await new AssetPack(apConfig).run();
      }
    },
    buildEnd: async () => {
      if (ap) {
        await ap.stop();
        ap = undefined;
      }
    }
  };
}

export default defineConfig({
  plugins: [
    vueRouter(),
    vue({
      script: {
        defineModel: true,
        propsDestructure: true
      },
    }),
    vueDevTools(),
    autoImport({
      imports: ['vue', VueRouterAutoImports],
      dts: true,
      eslintrc: {
        enabled: true
      }
    }),
    unoCSS(),
    icons({}),
    assetpackPlugin()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
