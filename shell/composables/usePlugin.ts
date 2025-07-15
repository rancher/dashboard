import { Plugin } from '@shell/types/plugin';
import { getPlugins } from '@shell/core/plugins-impl';

export const usePlugin = (): Plugin => {
  const plugin = getPlugins();

  if (!plugin) {
    throw new Error('usePlugin must be called after the plugin has been initialized');
  }

  return plugin;
};
