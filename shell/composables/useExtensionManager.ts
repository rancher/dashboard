import { ExtensionManager } from '@shell/types/extension-manager';
import { getExtensionManager } from '@shell/core/extension-manager-impl';

export const useExtensionManager = (): ExtensionManager => {
  const extension = getExtensionManager();

  if (!extension) {
    throw new Error('useExtensionManager must be called after the extensionManager has been initialized');
  }

  return extension;
};
