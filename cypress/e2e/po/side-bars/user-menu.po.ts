import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class UserMenuPo extends ComponentPo {
  constructor() {
    super('.user.user-menu');
  }

  // open user menu
  open(): Cypress.Chainable {
    return this.self().click({ force: true });
  }

  // get user menu
  getUserMenu(): Cypress.Chainable {
    return cy.get('.tooltip > div > .tooltip-inner');
  }

  getMenuLinks(): Cypress.Chainable {
    return this.getUserMenu().find('.user-menu-item').should('have.length', 3);
  }

  // menu link labels: 'Preferences', 'Account & API Keys', or 'Log Out'
  clickMenuLink(label: string) {
    return this.getMenuLinks().contains(label).click({ force: true });
  }

  checkOpen() {
    this.getUserMenu().should('exist');
  }

  checkClosed() {
    this.getUserMenu().should('not.exist');
  }
}
