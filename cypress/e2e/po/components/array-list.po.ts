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

  clickAdd(): Cypress.Chainable {
    return this.self().find(`[data-testid="array-list-button"]`).click();
  }

  setValueAtIndex(value: string, index: number): Cypress.Chainable {
    this.clickAdd();

    return this.self().find(`[data-testid="array-list-box${ index }"]`).find('input').type(value);
  }
}
