import { initExtensionManager } from './extension-manager-impl';

export default function(context, inject) {
  const extensionManager = initExtensionManager(context);
  const deprecationMessage = '[DEPRECATED] `this.$plugin` is deprecated and will be removed in a future version. Use `this.$extension` instead.';

  inject('plugin', deprecationProxy(extensionManager, deprecationMessage));
  inject('extension', extensionManager);
}

/**
 * Proxy to log a deprecation warning when target is accessed. Only prints
 * deprecation warnings in dev builds.
 * @param {*} target the object to proxy
 * @param {*} message the deprecation warning to print to the console
 * @returns The proxied target that prints a deprecation warning when target is
 * accessed
 */
const deprecationProxy = (target, message) => {
  const deprecationHandler = {
    get(target, prop) {
      // eslint-disable-next-line no-console
      console.warn(message);

      return Reflect.get(target, prop);
    }
  };

  // an empty handler allows the proxy to behave just like the original target
  const proxyHandler = !!process.env.dev ? deprecationHandler : {};

  return new Proxy(target, proxyHandler);
};

export function getProviders(context) {
  // Custom Providers from extensions - initialize each with the store and the i18n service
  // Wrap in try ... catch, to prevent errors in an extension breaking the page
  try {
    const extensionClasses = context.$plugin.listDynamic('provisioner').map((name) => context.$plugin.getDynamic('provisioner', name));
    const extensions = extensionClasses.map((c) => new c({ ...context }));

    return extensions;
  } catch (e) {
    console.error('Error loading provisioner(s) from extensions', e); // eslint-disable-line no-console
  }
}
