import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberSearchableSelectPo extends EmberComponentPo {
  /**
   * Set a custom value - assumes the dropdown is open
   * @param value
   */
  setAndSelect(value: string) {
    // in some cases this won't actually select anything
    this.self().find('input').type(value);
    this.select(value);
  }

  clickAndSelect(value: string) {
    this.self().click();
    this.select(value);
  }

  /**
   * Select the option at the provided index - does NOT assume dropdown is open
   * @param idx
   */
  clickAndSelectIndex(idx: number) {
    this.self().click();
    this.getOptions().eq(idx).click();
  }

  /**
   * Select an option - assumes the dropdown is open
   * @param value display value of the desired option
   */
  select(value:string) {
    cy.iFrame().find('.searchable-option').contains(value).click();
  }

  /**
   * Get a list of available options
   * @returns array of dropdown option elements
   */
  getOptions(): Cypress.Chainable {
    return this.self().find('.searchable-option');
  }
}
