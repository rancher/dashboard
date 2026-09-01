import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class SimpleBoxPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  simpleBox(): Cypress.Chainable {
    return cy.getId('simple-box-container');
  }
}
