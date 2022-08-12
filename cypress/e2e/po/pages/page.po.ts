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

  waitForPage(params?: string, fragment?: string) {
    return cy.url().should('include', `${ Cypress.config().baseUrl + this.path }${ !!params ? `?${ params }` : '' }${ !!fragment ? `#${ fragment }` : '' }`);
  }

  isCurrentPage(): Cypress.Chainable<boolean> {
    return cy.url().then(url => url === Cypress.config().baseUrl + this.path);
  }

  checkIsCurrentPage() {
    return this.isCurrentPage().should('eq', true);
  }
}
