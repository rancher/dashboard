import { throttle } from 'lodash';
import { createExtensionManager } from '@shell/core/extension-manager-impl';
import { ShellApiImpl } from '@shell/apis/shell';

/**
 * Initialise the APIs that are available in the shell
 *
 * This is loaded during app startiup in `initialize/index.js`
 */
export function initUiApis(context: any, inject: any, vueApp: any) {
  // ======================================================================================================================
  // Extension Manager
  // ======================================================================================================================
  const extensionManager = createExtensionManager(context);
  const deprecationMessage = '[DEPRECATED] `this.$plugin` is deprecated and will be removed in a future version. Use `this.$extension` instead.';

  registerApi('plugin', deprecationProxy(extensionManager, deprecationMessage), inject, vueApp);
  registerApi('extension', extensionManager, inject, vueApp);

  // ======================================================================================================================
  // Shell API
  // ======================================================================================================================
  registerApi('shell', new ShellApiImpl(context.store), inject, vueApp);
}

// ======================================================================================================================
// Helpers
// ======================================================================================================================

function registerApi(name: string, api: any, inject: any, vueApp: any) {
  inject(name, api);
  vueApp.provide(`$${ name }`, api);
}

/**
 * Proxy to log a deprecation warning when target is accessed. Only prints
 * deprecation warnings in dev builds.
 * @param {*} target the object to proxy
 * @param {*} message the deprecation warning to print to the console
 * @returns The proxied target that prints a deprecation warning when target is
 * accessed
 */
const deprecationProxy = (target: any, message: string) => {
  const logWarning = throttle(() => {
    // eslint-disable-next-line no-console
    console.warn(message);
  }, 150);

  const deprecationHandler = {
    get(target: any, prop: any) {
      logWarning();

      return Reflect.get(target, prop);
    }
  };

  // an empty handler allows the proxy to behave just like the original target
  const proxyHandler = !!process.env.dev ? deprecationHandler : {};

  return new Proxy(target, proxyHandler);
};
