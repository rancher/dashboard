import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import RcItemCardPo from '@/cypress/e2e/po/components/rc-item-card.po';

export default class ClusterToolsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/tools`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterToolsPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ClusterToolsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Tools');
  }

  private clickAction(chartName: string, actionLabel: string) {
    const actionMenu = this.getCardByName(chartName).openActionMenu();

    return actionMenu.getMenuItem(actionLabel).click();
  }

  featureChartCards() {
    return cy.get('[data-testid="tools-app-chart-cards"]').find('[data-testid*="item-card-"]');
  }

  getCardByName(name: string): RcItemCardPo {
    return RcItemCardPo.getCardByTitle(name);
  }

  goToInstall(name: string) {
    return this.clickAction(name, 'Install');
  }

  deleteChart(name: string) {
    return this.clickAction(name, 'Remove');
  }

  editChart(name: string) {
    return this.clickAction(name, 'Edit current version');
  }

  getChartVersion(name: string) {
    return this.getCardByName(name).self().find('[data-testid="app-chart-card-sub-header-item"]').first();
  }
}
