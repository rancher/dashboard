import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ButtonFileSelectorPo extends ComponentPo {
  /**
  * Returns a file-selector button
  * @param id
  * @returns
  */
  static readFromFileButton(): Cypress.Chainable {
    return cy.getId('file-selector__uploader-button');
  }
}
