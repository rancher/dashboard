import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class LabeledSelectPo extends ComponentPo {
  toggle() {
    return this.self().click();
  }

  /**
     * Selects nth option dropdown, where the first optiodn is in position 1
     * @param optionPosition
     * @returns
     */
  clickOption(optionPosition: number) {
    return this.self().get(`.vs__dropdown-menu .vs__dropdown-option:nth-child(${ optionPosition })`).click();
  }

  clickOptionWithLabel(label: string) {
    return this.getOptions().contains('li', label).invoke('index').then((index: number) => {
      return this.clickOption(index + 1);
    });
  }

  clickLabel(label: string) {
    return this.getOptions().contains('li', label).click();
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

  /**
   * Filter list by typing name
   * @returns
   */
  filterByName(name: string) {
    return this.self().type(name);
  }
}
