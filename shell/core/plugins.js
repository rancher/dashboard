import { getPlugins, initPlugins } from './plugins-impl';

export default function(context, inject) {
  initPlugins(context);
  inject('plugin', getPlugins());
}
