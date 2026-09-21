import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).its('response.statusCode').should('eq', 201);

    // After the install/upgrade request resolves, the app itself still has to fetch
    // the resulting catalog.cattle.io.operation, wait for its `logs` link to become
    // available (up to 30s internally - see DEFAULT_WAIT_TIMEOUT in
    // shell/plugins/dashboard-store/resource-class.js) and only then open the log
    // terminal window. A fixed cy.wait(15000) here was frequently shorter than that,
    // so retry-wait for the terminal to actually be visible instead of guessing a
    // fixed delay - this is both more reliable (waits exactly as long as needed) and
    // usually faster (doesn't wait 15s when the terminal shows up sooner).
    terminal.waitForTerminalToBeVisible(LONG_TIMEOUT_OPT);
    terminal.closeTerminal();

    installableParts.forEach((item:string) => {
      // Same reasoning as above: installs can still be settling (e.g. "Pending-Install")
      // for a while after the terminal opens/closes, so give this more than the 10s
      // default too.
      this.appsList().resourceTableDetails(item, 1, LONG_TIMEOUT_OPT).should('contain', 'Deployed');
    });

    // timeout to give time for everything to be setup, otherwise the extension
    // won't find the chart and show the correct screen
    return cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  }
}
