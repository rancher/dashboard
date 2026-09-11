import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';

export default class ListRowPo extends ComponentPo {
  /**
   * @param options timeout for the column lookup. Cypress timeouts are per
   * command, so the timeout given to whatever produced the row does not carry
   * over and the column otherwise falls back to `defaultCommandTimeout`.
   */
  column(index: number, options?: GetOptions) {
    return this.self().find('td', options).eq(index);
  }

  /**
   * Get the action button for a row
   * NB: Depending on the view flat-list or namespaced view,
   * the action button could be in a different column
   */
  actionBtn() {
    return this.self().find('[data-testid*="action-button"]');
  }

  get(selector: string, options?: any) {
    return this.self().get(selector, options);
  }
}
