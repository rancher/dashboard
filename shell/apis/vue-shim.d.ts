/* eslint-disable */
import { ShellApi, ExtensionManagerApi, ResourcesApiProvider, VersionApi } from '@shell/apis';

export {};

declare module 'vue' {
  interface ComponentCustomProperties {
    $shell: ShellApi,
    $extension: ExtensionManagerApi,
    $resources: ResourcesApiProvider,
    $version: VersionApi,
  }
}