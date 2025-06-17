import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export class LoggingOverviewPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/logging`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoggingOverviewPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(LoggingOverviewPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Logging');
    new LoggingOverviewPagePo(clusterId).waitForPage();
  }
}
