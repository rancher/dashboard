import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';
import ReposListPagePo from '@/cypress/e2e/po/pages/repositories.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import KubewardenExtensionPo from '@/cypress/e2e/po/pages/extensions/kubewarden.po';

const extensionName = 'kubewarden';

describe('Kubewarden Extension', { tags: '@adminUser' }, () => {
  before(() => {
    cy.login();

    ExtensionsPagePo.goTo();
    const extensionsPo = new ExtensionsPagePo();
    const kubewardenPo = new KubewardenExtensionPo();

    // install extensions operator if it's not installed
    extensionsPo.installExtensionsOperatorIfNeeded();
    kubewardenPo.addChartsRepoIfNeeded();
  });

  beforeEach(() => {
    cy.login();
    ExtensionsPagePo.goTo();
  });

  it('Should install Kubewarden extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.extensionTabAvailableClick();

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
    const chartsPage: ChartsPage = new ChartsPage('/c/local/apps/charts');

    chartsPage.goTo();
    chartsPage.waitForPage();
    chartsPage.self().getId('charts-header-title').invoke('text').should('contain', 'Charts');

    const appRepoList: ReposListPagePo = new ReposListPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForPage();
    cy.get('h1').contains('Repositories').should('exist');
  });

  it('Side-nav should contain Kubewarden menu item', () => {
    const kubewardenPo = new KubewardenExtensionPo();
    const productMenu = new ProductNavPo();

    kubewardenPo.goTo();

    const kubewardenNavItem = productMenu.groups().contains('Kubewarden');

    kubewardenNavItem.should('exist');
    kubewardenNavItem.click();
  });

  it('Kubewarden dashboard view should exist', () => {
    const kubewardenPo = new KubewardenExtensionPo();

    kubewardenPo.goTo();

    cy.get('h1').contains('Kubewarden').should('exist');
    cy.get('button').contains('Install Kubewarden').should('exist');
  });

  it('Should uninstall Kubewarden', () => {
    const extensionsPo = new ExtensionsPagePo();

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
});
