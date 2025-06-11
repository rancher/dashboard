import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import KubewardenExtensionPo from '@/cypress/e2e/po/pages/extensions/kubewarden.po';
import { catchTargetPageException } from '@/cypress/support/utils/exception-utils';

const extensionName = 'kubewarden';
const gitRepoName = 'rancher-extensions';
let removeExtensions = false;

describe('Kubewarden Extension', { tags: ['@extensions', '@adminUser'] }, () => {
  before(() => {
    catchTargetPageException('Navigation cancelled');
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

  it('Should install Kubewarden extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(null, 'available');

    // click on install button on card
    extensionsPo.extensionCardInstallClick(extensionName);
    extensionsPo.extensionInstallModal().should('be.visible');

    // click install
    extensionsPo.installModalInstallClick();

    // check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(extensionName);
    extensionsPo.extensionDetailsTitle().should('contain', extensionName);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Check Apps/Charts and Apps/Repo pages for route collisions', () => {
    const chartsPage: ChartsPage = new ChartsPage();

    chartsPage.goTo();
    chartsPage.waitForPage();
    chartsPage.self().getId('charts-header-title').invoke('text').should('contain', 'Charts');

    const appRepoList: RepositoriesPagePo = new RepositoriesPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForPage();
    cy.get('h1').contains('Repositories').should('exist');
  });

  it('Side-nav should contain Kubewarden menu item', () => {
    const kubewardenPo = new KubewardenExtensionPo();
    const productMenu = new ProductNavPo();

    kubewardenPo.goTo();
    kubewardenPo.waitForPage();

    const kubewardenNavItem = productMenu.groups().contains('Admission Policy Management');

    kubewardenNavItem.should('exist');
    kubewardenNavItem.click();
  });

  it('Kubewarden dashboard view should exist', () => {
    const kubewardenPo = new KubewardenExtensionPo();

    kubewardenPo.goTo();
    kubewardenPo.waitForPage();

    cy.get('h1').contains('Kubewarden').should('exist');
    cy.get('button').contains('Install Kubewarden').should('exist');
  });

  it('Should uninstall Kubewarden', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(extensionName);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(extensionName);
    extensionsPo.extensionDetailsTitle().should('contain', extensionName);
  });

  after(() => {
    if ( removeExtensions ) {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', gitRepoName);
    }
  });
});
