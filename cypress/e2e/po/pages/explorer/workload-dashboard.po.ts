import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import CardPo from '@/cypress/e2e/po/components/Resource/Detail/Card/statusCard.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

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
  }

  title() {
    return cy.get('[data-testid="workload-dashboard-title"]');
  }

  subtitle() {
    return cy.get('[data-testid="workload-dashboard-subtitle"]');
  }

  byStateSection() {
    return cy.get('[data-testid="workload-dashboard-by-state"]');
  }

  stateCards() {
    return cy.get('[data-testid="workload-dashboard-state-card"]');
  }

  byTypeSection() {
    return cy.get('[data-testid="workload-dashboard-by-type"]');
  }

  byTypeCard(index = 0) {
    return new CardPo(`[data-testid="resource-detail-status-card"]:eq(${ index })`);
  }

  byTypeCards() {
    return cy.get('[data-testid="resource-detail-status-card"]');
  }

  interceptSummariesAsEmpty() {
    return cy.intercept('GET', '/v1/*?summary=*', {
      summary: [], count: 0, data: []
    }).as('emptySummary');
  }

  waitForEmptySummaries() {
    return cy.wait('@emptySummary');
  }

  emptyState() {
    return cy.get('[data-testid="workload-dashboard-empty"]');
  }

  errorBanner() {
    return new BannersPo('.banner.error');
  }
}
