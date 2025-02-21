import ComponentPo from '@/cypress/e2e/po/components/component.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

export default class PagePo extends ComponentPo {
  constructor(protected path: string, selector = '.dashboard-root') {
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
  ], timeout = 10000) {
    getUrls.forEach((cUrl, i) => {
      cy.intercept('GET', cUrl).as(`getUrl${ i }`);
    });

    goTo();

    for (let i = 0; i < getUrls.length; i++) {
      // If an intercept for the url already exists... use the same wait (it'll fire on that one)
      const existingIndexOrCurrent = getUrls.indexOf(getUrls[i]);

      cy.wait([`@getUrl${ existingIndexOrCurrent }`], { timeout });
    }
  }

  goTo(params?: string, fragment?: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ this.path }${ !!params ? `?${ params }` : '' }${ !!fragment ? `#${ fragment }` : '' }`);
  }

  waitForPage(params?: string, fragment?: string) {
    return cy.url().should('include', `${ Cypress.config().baseUrl + this.path }${ !!params ? `?${ params }` : '' }${ !!fragment ? `#${ fragment }` : '' }`);
  }

  waitForPageWithExactUrl(params?: string, fragment?: string) {
    return cy.url().should('equal', `${ Cypress.config().baseUrl + this.path }${ !!params ? `?${ params }` : '' }${ !!fragment ? `#${ fragment }` : '' }`);
  }

  waitForPageWithSpecificUrl(path?: string, params?: string, fragment?: string) {
    return cy.url().should('include', `${ Cypress.config().baseUrl + (!!path ? path : this.path) }${ !!params ? `?${ params }` : '' }${ !!fragment ? `#${ fragment }` : '' }`);
  }

  isCurrentPage(isExact = true): Cypress.Chainable<boolean> {
    return cy.url().then((url) => {
      if (isExact) {
        return url === Cypress.config().baseUrl + this.path;
      } else {
        return url.indexOf(Cypress.config().baseUrl + this.path) === 0;
      }
    });
  }

  checkIsCurrentPage(exact = true) {
    return this.isCurrentPage(exact).should('eq', true);
  }

  mastheadTitle() {
    return this.self().find('.primaryheader h1').invoke('text');
  }

  waitForMastheadTitle(title: string) {
    return this.mastheadTitle().should('contain', title);
  }

  navToMenuEntry(label: string) {
    BurgerMenuPo.toggle();
    BurgerMenuPo.burgerMenuNavToMenubyLabel(label);
  }

  navToClusterMenuEntry(label: string) {
    BurgerMenuPo.toggle();
    BurgerMenuPo.burgerMenuNavToClusterbyLabel(label);
  }

  navToSideMenuGroupByLabel(label: string) {
    const nav = new ProductNavPo();

    nav.navToSideMenuGroupByLabel(label);
  }

  navToSideMenuEntryByLabel(label: string) {
    const nav = new ProductNavPo();

    nav.navToSideMenuEntryByLabel(label);
  }

  productNav(): ProductNavPo {
    return new ProductNavPo();
  }

  header() {
    return new HeaderPo();
  }

  extensionScriptImport(name: string) {
    return this.self().get(`[data-purpose="extension"]`).get(`[id*="${ name }"]`);
  }
}
