import PagePo from '@/cypress/e2e/po/pages/page.po';
import ChartInstalledAppsListPo from '@/cypress/e2e/po/lists/chart-installed-apps.po';

/**
 * List page for catalog.cattle.io.app resources
 */
export default class ChartInstalledAppsPagePo extends PagePo {
  private static createPath(clusterId: string, product: 'apps' | 'manager') {
    return `/c/${ clusterId }/${ product }/catalog.cattle.io.app`;
  }

  static goTo(clusterId: string, product: 'apps' | 'manager'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ChartInstalledAppsPagePo.createPath(clusterId, product));
  }

  constructor(clusterId = 'local', product: 'apps' | 'manager') {
    super(ChartInstalledAppsPagePo.createPath(clusterId, product));
  }

  filter(key: string) {
    this.self().get('.input-sm.search-box').type(key);
  }

  list(): ChartInstalledAppsListPo {
    return new ChartInstalledAppsListPo('[data-testid="installed-app-catalog-list"]');
  }
}
