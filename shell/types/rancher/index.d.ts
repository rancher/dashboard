declare module '@rancher/auto-import' {
  export function importTypes(ext: any): void;
}

declare module '@shell/config/version' {
  export const CURRENT_RANCHER_VERSION: string;
  export function getVersionData(): any;
}
