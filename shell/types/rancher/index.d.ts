declare module '@rancher/auto-import' {
  export function importTypes(ext: any): void;
}

/**
 * `shell/config/version` is plain JS. This shim, not the JS, is what TS resolves
 * an import of it against, so it has to list every export the module has. A
 * missing one reads as "no exported member" at each of its call sites.
 */
declare module '@shell/config/version' {
  export const CURRENT_RANCHER_VERSION: string;
  export function getVersionData(): any;
  export function setVersionData(v: any): void;
  export function getKubeVersionData(): any;
  export function setKubeVersionData(v: any): void;
  export function isRancherPrime(): boolean;
}
