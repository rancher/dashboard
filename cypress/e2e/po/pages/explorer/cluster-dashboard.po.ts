import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class ClusterDashboardPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterDashboardPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ClusterDashboardPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();

    BurgerMenuPo.toggle();
    burgerMenu.clusters().contains(clusterId).click();
  }

  clusterToolsButton(): Cypress.Chainable {
    return cy.get('.tools-button').contains('Cluster Tools');
  }
}
