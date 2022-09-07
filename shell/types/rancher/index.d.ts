declare module '@rancher/auto-import' {
  export function importTypes(ext: any): void;
}

declare module '@shell/store/type-map' {
  export function DSL(store: any, name: string): any;
}
