import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ArrayListPo extends ComponentPo {
  /**
   * Return a given array list item by index
   * @returns
   */
  arrayListItem(index: number): Cypress.Chainable {
    return this.self().find(`[data-testid="array-list-box${ index }"]`);
  }

  /**
   * Closes a given array list item by index
   * @returns
   */
  closeArrayListItem(index: number): Cypress.Chainable {
    return this.arrayListItem(index).find('.btn.role-link.close.btn-sm').click();
  }
}
