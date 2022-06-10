import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class FormPo extends ComponentPo {
  /**
   * Search all the labels found inside the form and return the input field
   * @returns
   */
  labels(): Cypress.Chainable {
    return this.self().find('.labeled-input');
  }

  /**
   * Search all the radio containers found inside the form and return the radio input
   * @returns
   */
  radios(): Cypress.Chainable {
    return this.self().find('.radio-container');
  }

  /**
   * Search all the radio groups found inside the form and return them
   * @returns
   */
  radioGroups(): Cypress.Chainable {
    return this.self().find('.radio-group');
  }

  /**
   * Search all the checkbox containers found inside the form and return the checkbox input
   * @returns
   */
  checkboxes(): Cypress.Chainable {
    return this.self().find('.checkbox');
  }
}
