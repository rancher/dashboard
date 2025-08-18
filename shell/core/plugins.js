import { getExtensionInstance, initExtensionManager } from './plugins-impl';

export default function(context, inject) {
  initExtensionManager(context);
  inject('plugin', getExtensionInstance());
}
