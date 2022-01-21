export interface Plugin {
  addProduct(importFn: Function): void;
  addLocale(locale: string, label: string): void;

  // get store(): any;
}
