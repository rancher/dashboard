import { ExtensionManager } from '@shell/types/extension-manager';
import { getExtensionManager } from '@shell/core/extension-manager-impl';

/**
 * Provides access to the registered extension manager instance. Used within Vue
 * components or other composables that require extension functionality.
 * @returns The extension manager instance
 */
export const useExtensionManager = (): ExtensionManager => {
  const extension = getExtensionManager();

  if (!extension) {
    throw new Error('useExtensionManager must be called after the extensionManager has been initialized');
  }

  return extension;
};
