import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ListRowPo extends ComponentPo {
  column(index: number) {
    return this.self().find('td').eq(index);
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

  /**
   * Returns the state-description row that follows this row
   * @returns
   */
  description() {
    return this.self().then(($row) => {
      const testId = $row.attr('data-testid');

      return cy.get('body').find(`[data-testid="${ testId }-description"]`);
    });
  }
}
