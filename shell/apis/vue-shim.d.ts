/* eslint-disable */
import { ShellApi, ExtensionManagerApi, ResourcesApiProvider } from '@shell/apis';

export {};

declare module 'vue' {
  interface ComponentCustomProperties {
    $shell: ShellApi,
    $extension: ExtensionManagerApi,
    $resources: ResourcesApiProvider,
  }
}