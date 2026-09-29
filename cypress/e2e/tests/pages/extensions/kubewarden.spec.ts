import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import KubewardenExtensionPo from '@/cypress/e2e/po/pages/extensions/kubewarden.po';
import { catchTargetPageException } from '@/cypress/support/utils/exception-utils';
import { qase } from '@/cypress/support/qase';

const extensionName = 'SUSE Security Admission Controller';
const gitRepoName = 'rancher-extensions';
let removeExtensions = false;

/**
 * Make sure the Available tab is actually showing the kubewarden card before trying to install it.
 *
 * The catalog index can already serve the chart (the before hook waits for that) while this page
 * still renders a catalog without it, and the page does not re-fetch on its own - the install then
 * fails on a card lookup that never resolves. Reload to re-read the catalog, bounded so a genuinely
 * absent extension still fails on the install's own assertion rather than looping.
 */
function ensureKubewardenCardListed(extensionsPo: ExtensionsPagePo, attempts = 15): void {
  extensionsPo.extensionTabAvailableClick();
  extensionsPo.waitForPage(null, 'available');
  extensionsPo.loading().should('not.exist');
  extensionsPo.checkForExtensionCardWithName(extensionName).then((cardListed) => {
    if (cardListed || attempts === 0) {
      return;
    }
    // checkForExtensionCardWithName reads the DOM once, so this has to do the waiting itself:
    // give the catalog time to render, and every third attempt reload to force a re-fetch for
    // the case where the page cached a catalog from before the chart was published.
    //
    // Known issue rancher/dashboard#19319: the reload is a bypass for product behaviour - once the
    // Extensions page has rendered a catalog it never re-reads it, so a chart that becomes
    // available afterwards stays invisible until the user reloads by hand. Waiting cannot fix
    // that, because the API is already serving the chart.
    cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
    if (attempts % 3 === 0) {
      cy.reload();
      extensionsPo.waitForPage();
    }
    ensureKubewardenCardListed(extensionsPo, attempts - 1);
  });
}

function verifyKubewardenInstalledDetails(extensionsPo: ExtensionsPagePo) {
  extensionsPo.waitForTabs();
  extensionsPo.extensionTabInstalledClick();
  extensionsPo.waitForPage(null, 'installed');
  extensionsPo.extensionCardClick(extensionName);
  extensionsPo.extensionDetailsTitle().should('contain', extensionName);
  extensionsPo.extensionDetailsCloseClick();
}

describe('Kubewarden Extension', { tags: ['@extensions', '@adminUser'] }, () => {
  before(() => {
    catchTargetPageException(['Navigation cancelled', 'Network Error']);
    cy.login();

    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    // install the ui-plugin-charts repo
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-charts', 'main', gitRepoName).then(() => {
      removeExtensions = true;
    });

    // The repo reports Downloaded and Active before its chart index necessarily serves the
    // extension, and the Available tab then renders no cards at all - every attempt in the run
    // re-visits the same empty catalog and fails the card lookup identically. Poll the filtered
    // index (the one the UI reads) until kubewarden is offered.
    //
    // Only log on exhaustion: Cypress does not retry a failing before hook, so asserting here
    // would take down the whole describe instead of letting the tests retry.
    const waitForKubewardenInCatalog = (retries = 30): void => {
      // Read the index directly with failOnStatusCode off: while the repo is still being indexed
      // this endpoint answers 500, and a throwing request here would fail the before hook, which
      // Cypress does not retry - taking down the whole describe instead of one test.
      //
      // Known issue rancher/dashboard#19318: a repo whose index is still being built answers 500
      // rather than an empty index or a 404, so callers cannot tell "not ready yet" from a real
      // server error without ignoring status codes entirely.
      cy.request({
        url:              `${ Cypress.env('api') }/v1/catalog.cattle.io.clusterrepos/${ gitRepoName }?link=index`,
        failOnStatusCode: false,
      }).then((resp) => {
        if (resp.status === 200 && resp.body?.entries?.kubewarden) {
          return;
        }
        if (retries === 0) {
          cy.log(`kubewarden is still not in the catalog index (last status ${ resp.status })`);

          return;
        }
        cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
        waitForKubewardenInCatalog(retries - 1);
      });
    };

    waitForKubewardenInCatalog();
  });

  beforeEach(() => {
    cy.login();
  });

  qase(1430, it('Should install Kubewarden extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    // Idempotent: no Installed tab → install Kubewarden from catalog (nothing installed yet).
    // Installed tab → open it: Kubewarden card present → only assert details; absent → install
    extensionsPo.checkForExtensionTab('installed').then((installedTabRendered) => {
      if (!installedTabRendered) {
        ensureKubewardenCardListed(extensionsPo);
        extensionsPo.installExtensionFromCatalog(extensionName, gitRepoName, 'kwInstall');
        verifyKubewardenInstalledDetails(extensionsPo);

        return;
      }
      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(null, 'installed');
      extensionsPo.checkForExtensionCardWithName(extensionName).then((kubewardenCardPresent) => {
        if (kubewardenCardPresent) {
          extensionsPo.extensionCardClick(extensionName);
          extensionsPo.extensionDetailsTitle().should('contain', extensionName);
          extensionsPo.extensionDetailsCloseClick();
        } else {
          ensureKubewardenCardListed(extensionsPo);
          extensionsPo.installExtensionFromCatalog(extensionName, gitRepoName, 'kwInstall');
          verifyKubewardenInstalledDetails(extensionsPo);
        }
      });
    });
  }));

  qase(1429, it('Check Apps/Charts and Apps/Repo pages for route collisions', () => {
    const chartsPage: ChartsPage = new ChartsPage();

    chartsPage.goTo();
    chartsPage.waitForPage();
    chartsPage.self().getId('charts-header-title').invoke('text').should('contain', 'Charts');

    const appRepoList: RepositoriesPagePo = new RepositoriesPagePo('local', 'apps');

    appRepoList.goTo('local', 'apps');
    appRepoList.waitForPage();
    cy.get('h1').contains('Repositories').should('exist');
  }));

  qase(1431, it('Side-nav should contain Kubewarden menu item', () => {
    const kubewardenPo = new KubewardenExtensionPo();
    const productMenu = new ProductNavPo();

    kubewardenPo.goTo();
    kubewardenPo.waitForPage();

    const kubewardenNavItem = productMenu.groups().contains('Admission Policy Management');

    kubewardenNavItem.should('exist');
    kubewardenNavItem.click();
  }));

  qase(1432, it('Kubewarden dashboard view should exist', () => {
    const kubewardenPo = new KubewardenExtensionPo();

    kubewardenPo.goTo();
    kubewardenPo.waitForPage();

    cy.get('h1').contains('SUSE Security Admission Controller').should('exist');
    cy.get('button').contains('Install SUSE Security Admission Controller').should('exist');
  }));

  qase(1433, it('Should uninstall Kubewarden', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTabs();

    // Idempotent across retries: a previous attempt may have already uninstalled
    // Kubewarden, in which case the Installed tab no longer exists. Only run the
    // uninstall flow when the extension is still installed - otherwise clicking the
    // (absent) Installed tab times out and the retry can never pass.
    extensionsPo.checkForExtensionTab('installed').then((installedTabRendered) => {
      if (!installedTabRendered) {
        return;
      }

      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(null, 'installed');
      extensionsPo.checkForExtensionCardWithName(extensionName).then((isInstalled) => {
        if (!isInstalled) {
          return;
        }

        // click on uninstall button on card
        extensionsPo.extensionCardUninstallClick(extensionName);
        extensionsPo.extensionUninstallModal().should('be.visible');
        extensionsPo.uninstallModalUninstallClick();

        // let's check the extension reload banner and reload the page
        extensionsPo.extensionReloadBanner().should('be.visible');
        extensionsPo.extensionReloadClick();
      });
    });

    // make sure extension card is in the available tab (the end state, whether this
    // attempt performed the uninstall or a previous one already did)
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(extensionName);
    extensionsPo.extensionDetailsTitle().should('contain', extensionName);
  }));

  after(() => {
    if ( removeExtensions ) {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', gitRepoName);
    }
  });
});
