import { HeaderPo as DefaultHeaderPo } from '@rancher/cypress/e2e/po/components/header.po';

// Example of extending the default HeaderPo to include custom elements
export default class HeaderPo extends DefaultHeaderPo {
  myButton(): Cypress.Chainable {
    return cy.get('[data-testid="some-custom-header-element"]');
  }
}
