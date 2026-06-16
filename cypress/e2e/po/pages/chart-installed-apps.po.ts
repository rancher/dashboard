import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

const terminal = new Kubectl();

/**
 * List page for catalog.cattle.io.app resources
 */
export default class ChartInstalledAppsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string, product: 'apps' | 'manager') {
    return `/c/${ clusterId }/${ product }/catalog.cattle.io.app`;
  }

  goTo(clusterId: string, product: 'apps' | 'manager'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ChartInstalledAppsListPagePo.createPath(clusterId, product));
  }

  constructor(clusterId = 'local', product: 'apps' | 'manager') {
    super(ChartInstalledAppsListPagePo.createPath(clusterId, product));
  }

  filter(key: string) {
    this.self().get('.input-sm.search-box').type(key);
  }

  appsList() {
    return new ResourceTablePo('[data-testid="installed-app-catalog-list"]');
  }

  waitForInstallCloseTerminal(interceptName: string, installableParts: Array<String>) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 201]);

    // giving it a small buffer so that the install is properly triggered
    cy.wait(15000); // eslint-disable-line cypress/no-unnecessary-waiting
    terminal.closeTerminal();

    installableParts.forEach((item:string) => {
      this.appsList().resourceTableDetails(item, 1).should('contain', 'Deployed');
    });

    // timeout to give time for everything to be setup, otherwise the extension
    // won't find the chart and show the correct screen
    return cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  }
}
