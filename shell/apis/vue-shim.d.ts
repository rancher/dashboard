/* eslint-disable */
import { ShellApi, ExtensionManagerApi, ResourcesApi } from '@shell/apis';

export {};

declare module 'vue' {
  interface ComponentCustomProperties {
    $shell: ShellApi,
    $extension: ExtensionManagerApi,
    $resources: ResourcesApi,
  }
}