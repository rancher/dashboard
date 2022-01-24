/**
 * Interface a Dashboard plugin
 */
export interface Plugin {
  /**
   * Add a product
   * @param importFn Function that will import the module containing a product definition
   */
  addProduct(importFn: Function): void;

  /**
   * Add a locale to the i18n store
   * @param locale Locale id (e.g. en-us)
   * @param label Label for the locale to be displayed in the i18n chooser
   */
  addLocale(locale: string, label: string): void;

  /**
   * Plugin metadata
   */
   metadata: any;
}
