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
   *
   * `options` (e.g. a longer timeout) is forwarded to the lookup: the button hydrates after the row's
   * cells (available actions load separately), so callers that act on it right after the row renders
   * may need to wait for it.
   */
  actionBtn(options?: GetOptions) {
    return this.self().find('[data-testid*="action-button"]', options);
  }

  get(selector: string, options?: any) {
    return this.self().get(selector, options);
  }
}
