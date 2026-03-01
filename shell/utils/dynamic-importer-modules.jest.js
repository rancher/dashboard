/**
 * Jest-compatible version of the @rancher/dynamic-importer-modules virtual module.
 *
 * In Vite builds the corresponding Vite plugin generates this module at build time,
 * filtering out test files.  In Jest we don't need that filtering (no bundle is
 * created), so we use plain import.meta.glob calls which the babel plugin
 * (babel-plugin-import-meta-glob.js) transforms into fast-glob + require() calls.
 */

export const listModules = import.meta.glob('@shell/list/**/*', { eager: false });
export const chartModules = import.meta.glob('@shell/chart/**/*', { eager: false });
export const editModules = import.meta.glob('@shell/edit/**/*', { eager: false });
export const detailModules = import.meta.glob('@shell/detail/**/*', { eager: false });
export const windowModules = import.meta.glob('@shell/components/Window/**/*', { eager: false });
export const machineConfigModules = import.meta.glob('@shell/machine-config/**/*', { eager: false });
export const cloudCredentialModules = import.meta.glob('@shell/cloud-credential/**/*', { eager: false });
export const promptRemoveModules = import.meta.glob('@shell/promptRemove/**/*', { eager: false });
export const productModules = import.meta.glob('@shell/config/product/*', { eager: false });
export const loginModules = import.meta.glob('@shell/components/auth/login/**/*', { eager: false });
export const dialogModules = import.meta.glob('@shell/dialog/**/*', { eager: false });
export const drawerModules = import.meta.glob('@shell/components/Drawer/**/*', { eager: false });
export const translationModules = import.meta.glob('@shell/assets/translations/*.yaml', { eager: false });
