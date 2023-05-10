import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class LabeledSelectPo extends ComponentPo {
  toggle() {
    return this.self().click();
  }

  clickOption(optionIndex: number) {
    return this.self().get(`.vs__dropdown-menu .vs__dropdown-option:nth-child(${ optionIndex })`).click();
  }

  /**
   * Checks selected option displays on dropdown
   * @param label
   * @returns
   */
  checkOptionSelected(label: string): Cypress.Chainable {
    return this.self().should('contain.text', label);
  }

  /**
   * Get dropdown options
   * @returns
   */
  getOptions(): Cypress.Chainable {
    return this.self().get('.vs__dropdown-menu > li');
  }

  /**
   * Check dropdown is open
   * @returns
   */
  isOpened() {
    return this.getOptions().should('exist');
  }

  /**
   * Check dropdown is closed
   * @returns
   */
  isClosed() {
    return this.getOptions().should('not.exist');
  }
}
