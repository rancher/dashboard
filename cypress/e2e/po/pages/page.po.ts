import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PagePo extends ComponentPo {
  constructor(protected path: string, selector: string = '.dashboard-root') {
    super(selector);
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visit(path);
  }

  /**
   * When dashboard loads it will always go out and fetch counts for the upstream cluster (management/counts --> v1/counts).
   *
   * If using this on a page with a specific cluster context it will make another counts request for counts for it (cluster/counts)
   * Note - If that cluster is the upstream one the request will be the same as management (v1/counts)
   */
  static goToAndWaitForGet(goTo: () => Cypress.Chainable, getUrls = [
    'v1/counts',
  ]) {
    getUrls.forEach((cUrl, i) => {
      cy.intercept('GET', cUrl).as(`getUrl${ i }`);
    });

    goTo();

    for (let i = 0; i < getUrls.length; i++) {
      // If an intercept for the url already exists... use the same wait (it'll fire on that one)
      const existingIndexOrCurrent = getUrls.indexOf(getUrls[i]);

      cy.wait([`@getUrl${ existingIndexOrCurrent }`], { timeout: 10000 });
    }
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
    return this.self().find('.title h1').invoke('text');
  }
}
