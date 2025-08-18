import { getExtensionManager, initExtensionManager } from './extension-manager-impl';

export default function(context, inject) {
  initExtensionManager(context);
  inject('plugin', getExtensionManager());
}
