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

    // After install, Rancher opens a window-manager terminal (#horizontal-window-manager) with the
    // Helm output, but its open/close timing varies and it can be absent (never opened, or already
    // closed) by the time we look - closing it unconditionally flaked on '#horizontal-window-manager'
    // not found. Close it only if it is actually open; a missing terminal just means nothing to close.
    cy.get('body').then(($body) => {
      if ($body.find('#horizontal-window-manager').length > 0) {
        terminal.closeTerminal();
      }
    });

    // After install, the wizard can briefly stay on "Installing..." before redirecting to the
    // installed-apps list; wait (generously) for the list to actually render before asserting on its
    // rows, rather than failing fast when the redirect is slow under CI load.
    this.appsList().self(LONG_TIMEOUT_OPT).should('be.visible');

    installableParts.forEach((item:string) => {
      this.appsList().resourceTableDetails(item, 1).should('contain', 'Deployed');
    });

    // timeout to give time for everything to be setup, otherwise the extension
    // won't find the chart and show the correct screen
    return cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  }
}
