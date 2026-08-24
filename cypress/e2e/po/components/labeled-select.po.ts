import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class LabeledSelectPo extends ComponentPo {
  toggle() {
    return this.self().click();
  }

  setOptionAndClick(label: string) {
    this.self().get('input[type="search"]').type(label);

    return this.clickOption(1);
  }

  clickOption(optionIndex: number) {
    return this.self().get(`.vs__dropdown-menu .vs__dropdown-option:nth-child(${ optionIndex })`).click({ force: true });
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

  checkContainsOptionSelected(label: string): Cypress.Chainable {
    return this.self().find('.vs__selected-options > span.vs__selected').should((elm) => {
      expect(elm.text().trim()).to.include(label);
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
   * As per `getOptions` but returns actual string values instead of elements
   */
  getOptionsAsStrings(): Cypress.Chainable<string[]> {
    return this.getOptions().then((options) => {
      return options.toArray().map((option) => option.textContent.trim());
    });
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

  /**
   * Click the deselect X button for a selected item
   * @param label The label of the selected item to deselect
   * @returns
   */
  clickDeselectButton(label: string): Cypress.Chainable {
    return this.self()
      .contains(label)
      .then(($selectedItem) => {
        // Use within() to scope the search to the selected item and click the button within that scope
        return cy.wrap($selectedItem).within(() => {
          cy.get('button.vs__deselect').click();
        });
      });
  }

  static byLabel(self: CypressChainable, label: string): LabeledSelectPo {
    return new LabeledSelectPo(
      self
        .contains('label', label)
        .closest('div')
        .next('.v-select')
    );
  }


  /**
   * Wait until the LabeledSelect is not loading
   * The loading property is used when labeledselect contents depend on an async method, eg a dropdown of aws instance types fetched from an aws api
   * @param timeout how long to wait for the loading spinner to disappear before throwing an error
   * @returns
   */
  waitForLoading(timeout = 20000): Cypress.Chainable {
    // data-testid lands on the inner v-select (LabeledSelect
    // has inheritAttrs: false), but the loading spinner is a sibling of v-select under
    // the outer .labeled-select wrapper, so we have to search from there instead
    return this.self()
      .closest('.labeled-select')
      .find('.icon-spinner', { timeout })
      .should('not.exist');
  }
}
