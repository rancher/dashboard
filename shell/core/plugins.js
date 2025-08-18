import { initExtensionManager } from './extension-manager-impl';

export default function(context, inject) {
  const extensionManager = initExtensionManager(context);

  inject('plugin', extensionManager);
  inject('extension', extensionManager);
}
