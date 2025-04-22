import PagePo from '@/cypress/e2e/po/pages/page.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { GetOptions } from '@/cypress/e2e/po/components/component.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';

const terminal = new Kubectl();

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

  sharedComponents(options?: GetOptions) {
    return new SharedComponentsPo('[data-testid="installed-app-catalog-list"]', this.self(options));
  }

  waitForInstallCloseTerminal(interceptName: string, installableParts: Array<String>) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).its('response.statusCode').should('eq', 201);

    // giving it a small buffer so that the install is properly triggered
    cy.wait(15000); // eslint-disable-line cypress/no-unnecessary-waiting
    terminal.closeTerminal();

    installableParts.forEach((item:string) => {
      this.sharedComponents().resourceTableDetails(item, 0).should('contain', 'Deployed');
    });

    // timeout to give time for everything to be setup, otherwise the extension
    // won't find the chart and show the correct screen
    return cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  }
}
