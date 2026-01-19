/* eslint-disable */
import { ShellApi, ExtensionManagerApi } from '@shell/apis';

export {};

declare module 'vue' {
  interface ComponentCustomProperties {
    $shell: ShellApi,
    $extension: ExtensionManagerApi,
  }
}