import { ExtensionProvider } from './extension/provider';

export default function({
  app,
  store,
}, inject) {
  const extensionProvider = new ExtensionProvider(app);

  // Things we want to expose to components via the '$extension' property
  inject('extension', {});

  // Load the extensions
  // The '@rancher/extensionsConfiguration' module is generated in webpack to load each package
  const extensionsConfiguration = require('@rancher/extensionsConfiguration');

  if (!extensionsConfiguration) {
    return;
  }

  extensionsConfiguration?.default({
    // This 'configure' method is used in the webpack configuration which generates '@rancher/extensionsConfiguration'
    async configure(module) {
      let extension;

      try {
        extension = await extensionProvider.create(module.default);

        // Add to the plugin store so the extensions page is aware it's been loaded/configured
        store.dispatch('uiplugins/addPlugin', extension);
      } catch (e) {
        console.error(`Error loading extension ${ extension.name }`); // eslint-disable-line no-console
        console.error(e); // eslint-disable-line no-console
      }
    }
  });
}
