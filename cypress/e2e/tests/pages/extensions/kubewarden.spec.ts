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

    cy.get('h1').contains('Kubewarden').should('exist');
    cy.get('button').contains('Install Kubewarden').should('exist');
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
