import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PagePo extends ComponentPo {
  constructor(private path: string, selector: string = '.dashboard-root') {
    super(selector);
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visit(path);
  }

  goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(this.path);
  }

  isCurrentPage(): Cypress.Chainable<boolean> {
    return cy.url().then(url => url === Cypress.config().baseUrl + this.path);
  }

  checkIsCurrentPage() {
    return this.isCurrentPage().should('eq', true);
  }
}
