import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class LabeledSelectPo extends ComponentPo {
  toggle() {
    return this.self().click();
  }

  setOptionAndClick(label: string) {
    this.self().get('input[type="search"]').type(label);

    return this.clickOption(1);
  }

  clickOption(optionIndex: number) {
    return this.self().get(`.vs__dropdown-menu .vs__dropdown-option:nth-child(${ optionIndex })`).click();
  }

  clickOptionWithLabel(label: string) {
    return this.getOptions().contains('li', label).invoke('index').then((index) => {
      return this.clickOption(index + 1);
    });
  }

  clickLabel(label: string) {
    const labelRegex = new RegExp(`^${ label } $`, 'g');

    return this.getOptions().contains(labelRegex).click();
  }

  /**
   * Checks selected option displays on dropdown
   * @param label
   * @returns
   */
  checkOptionSelected(label: string): Cypress.Chainable {
    return this.self().find('.vs__selected-options > span.vs__selected').should((elm) => {
      expect(elm.text().trim()).to.equal(label);
    });
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
