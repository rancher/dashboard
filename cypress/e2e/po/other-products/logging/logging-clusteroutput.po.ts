import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import SelectPo from '@/cypress/e2e/po/components/select.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export class LoggingClusteroutputListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/logging/logging.banzaicloud.io.clusteroutput`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoggingClusteroutputListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(LoggingClusteroutputListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Logging');
    sideNav.navToSideMenuEntryByLabel('ClusterOutput');
  }
}

export class LoggingClusterOutputCreateEditPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/logging/logging.banzaicloud.io.clusteroutput`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId: string, namespace?: string, id?: string) {
    super(LoggingClusterOutputCreateEditPagePo.createPath(clusterId, namespace, id));
  }

  selectOutputProviderWithLabel(providerName: string) {
    return new SelectPo(this.self()).clickOptionWithLabel(providerName);
  }

  target(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'URL');
  }
}
