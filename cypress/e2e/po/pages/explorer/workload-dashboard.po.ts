import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export default class WorkloadDashboardPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/workload-dashboard`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadDashboardPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadDashboardPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('Workloads');
  }

  title() {
    return cy.get('.workload-dashboard h1');
  }

  subtitle() {
    return cy.get('.workload-dashboard .sub-title');
  }

  byStateSection() {
    return cy.get('.bento-grid');
  }

  stateCards() {
    return cy.get('.state-card');
  }

  byTypeSection() {
    return cy.get('.card-grid');
  }

  byTypeCards() {
    return cy.get('[data-testid="resource-detail-status-card"]');
  }

  emptyState() {
    return cy.get('.empty-state');
  }

  errorBanner() {
    return cy.get('.banner.error');
  }
}
