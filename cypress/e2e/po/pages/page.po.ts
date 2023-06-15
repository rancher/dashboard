import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PagePo extends ComponentPo {
  constructor(protected path: string, selector: string = '.dashboard-root') {
    super(selector);
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visit(path);
  }

  static goToAndWaitForCounts(goTo: () => Cypress.Chainable) {
    cy.intercept('GET', '/v1/counts').as('counts');

    goTo();

    cy.wait(['@counts'], { timeout: 10000 });
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

  mastheadTitle() {
    return this.self().find('.primaryheader h1').invoke('text');
  }
}
