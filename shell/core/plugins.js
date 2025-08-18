import { getExtensionManager, initExtensionManager } from './plugins-impl';

export default function(context, inject) {
  initExtensionManager(context);
  inject('plugin', getExtensionManager());
}
