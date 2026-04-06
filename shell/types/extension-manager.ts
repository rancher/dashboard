import { EXT_IDS_VALUES } from '@shell/core/plugin';
import { ClusterProvisionerContext } from '@shell/core/types';

type ExtensionManagerType = { [name: string]: Function, }
export type ExtensionManagerTypes =
  { [type in EXT_IDS_VALUES]?: ExtensionManagerType } & // eslint-disable-line no-unused-vars
  { [name: string]: ExtensionManagerType }

export type ExtensionManager = {
  internal(): any;
  loadPluginAsync(plugin: any): Promise<void>;
  loadAsync(id: string, mainFile: string): Promise<void>;
  loadBuiltinExtensions(): void;
  registerBuiltinExtension(id: string, module: any): void;
  initBuiltinExtension(id: string, module: any): void;
  logout(): Promise<void>;
  removePlugin(name: string): Promise<void>;
  removeTypeFromStore(store: any, storeName: string, types: string[]): any[];
  applyPlugin(plugin: any): void;
  register(type: string, name: string, fn: Function): void;
  unregister(type: string, name: string, fn: Function): void;
  getAll(): ExtensionManagerTypes;
  getPlugins(): any;
  getDynamic(typeName: string, name: string): any;
  getValidator(name: string): any;
  getUIConfig(type: string, uiArea: string): any[];
  getAllUIConfig(): any;
  getProviders(context: ClusterProvisionerContext): any[];
  lastLoad: number;
  listDynamic(typeName: string): string[];
  products: any[];
  loadProducts(loadPlugins: any[]): void;
}
