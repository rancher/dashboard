import PagePo from '@/cypress/e2e/po/pages/page.po';
import HostedProvidersListPo from '@/cypress/e2e/po/lists/hosted-providers-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * List page for kontainerDriver resources
 */
export default class HostedProvidersPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/hostedprovider`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HostedProvidersPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(HostedProvidersPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuGroupByLabel('Providers');
    sideNav.navToSideMenuEntryByLabel('Hosted Providers');
  }

  // goToDriverListAndGetDriverDetails(driverName: string): Cypress.Chainable<{ id: string }> {
  //   let driverDetails = [];

  //   cy.intercept({
  //     method: 'GET',
  //     path:   '/v3/kontainerDrivers/',
  //   }, (req) => {
  //     req.continue((res) => {
  //       driverDetails = res.body.data;
  //     });
  //   }).as('request');

  //   super.goTo();

  //   return cy.wait('@request', { timeout: 10000 }).then(() => driverDetails.filter((c) => c.name === driverName)[0]);
  // }

  title() {
    return cy.contains('.title > h1', 'Hosted Providers');
  }

  list(): HostedProvidersListPo {
    return new HostedProvidersListPo('[data-testid="hosted-provider-list"]');
  }
}
