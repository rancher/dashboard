import { Plugin } from '@shell/types/plugin';
import { getExtensionManager } from '~/shell/core/extension-manager-impl';

export const useExtensionManager = (): Plugin => {
  const plugin = getExtensionManager();

  if (!plugin) {
    throw new Error('useExtensionManager must be called after the plugin has been initialized');
  }

  return plugin;
};
