import './styles/global.css';
import 'open-props/postcss/style';
import 'open-props/colors-hsl';

import { createApp } from 'vue';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import { autoAnimatePlugin } from '@formkit/auto-animate/vue';
import App from './App.vue';
import gsap from 'gsap';
import { MotionPathPlugin, Flip } from 'gsap/all';

gsap.install(window);
gsap.registerPlugin(MotionPathPlugin);
gsap.registerPlugin(Flip);

const app = createApp(App);

const router = createRouter({
  history: createWebHistory(),
  routes
});

const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(autoAnimatePlugin);
app.mount('#app');

if (import.meta.hot) {
  handleHotUpdate(router);
}
