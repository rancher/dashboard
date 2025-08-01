import { getPlugins, initPlugins } from './plugins-impl';

export default function(context, inject, vueApp) {
  initPlugins(context, vueApp);
  inject('plugin', getPlugins());
}
