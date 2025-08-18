import { initExtensionManager } from './extension-manager-impl';

export default function(context, inject) {
  const extensionManager = initExtensionManager(context);
  const deprecationMessage = '[DEPRECATED] `this.$plugin` is deprecated and will be removed in a future version. Use `this.$extension` instead.';

  inject('plugin', deprecationProxy(extensionManager, deprecationMessage));
  inject('extension', extensionManager);
}

/**
 * Proxy to log a deprecation warning when target is accessed
 * @param {*} target the object to proxy
 * @param {*} message the deprecation warning to print to the console
 * @returns The proxied target that prints a deprecation warning when target is
 * accessed
 */
const deprecationProxy = (target, message) => {
  return new Proxy(target, {
    get(target, prop) {
      // eslint-disable-next-line no-console
      console.warn(message);

      return Reflect.get(target, prop);
    }
  });
};
