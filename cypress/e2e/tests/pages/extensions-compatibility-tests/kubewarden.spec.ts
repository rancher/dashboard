import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import KubewardenPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/kubewarden.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import * as jsyaml from 'js-yaml';

const EXTENSION_NAME = 'kubewarden';
const EXTENSION_VERSION = '2.0.0';
const EXTENSION_REPO = 'https://github.com/rancher/kubewarden-ui';
const EXTENSION_BRANCH = 'gh-pages';
const EXTENSION_CLUSTER_REPO_NAME = 'kubewarden-ui-extension';
const EXTENSION_KW_REPO_ADD = 'addKwRepo';
const EXTENSION_CHART_CREATION = 'chartCreation';

const kubewardenPo = new KubewardenPo();
const namespacePicker = new NamespaceFilterPo();

describe('Extensions Compatibility spec', { tags: ['@kubewarden', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  // it('add extension repository', () => {
  //   // // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
  //   const extensionsPo = new ExtensionsPagePo();

  //   extensionsPo.addExtensionsRepositoryDirectLink(EXTENSION_REPO, EXTENSION_BRANCH, EXTENSION_CLUSTER_REPO_NAME, true);
  // });

  // it('Should install an extension', () => {
  //   const extensionsPo = new ExtensionsPagePo();

  //   extensionsPo.goTo();

  //   extensionsPo.extensionTabAvailableClick();

  //   // click on install button on card
  //   extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
  //   extensionsPo.extensionInstallModal().should('be.visible');

  //   // select version and click install
  //   extensionsPo.installModalSelectVersionLabel(EXTENSION_VERSION);
  //   extensionsPo.installModalInstallClick();

  //   // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // make sure extension card is in the installed tab
  //   extensionsPo.extensionTabInstalledClick();
  //   extensionsPo.extensionCardClick(EXTENSION_NAME);
  //   extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  //   extensionsPo.extensionDetailsCloseClick();
  // });

  it('Should setup all of the needed backend parts', () => {
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=install').as(EXTENSION_CHART_CREATION);

    kubewardenPo.goTo();
    kubewardenPo.waitForTitle('h1', 'Kubewarden');

    // we need to change the namespace picker in order for the install check on the list view
    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('All Namespaces');
    namespacePicker.closeDropdown();

    // start install steps
    kubewardenPo.startBackendInstallClick();

    // // 1 - install cert manager
    // kubewardenPo.openTerminalClick();
    // kubewardenPo.kubectlShell().executeCommand('apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml');
    // kubewardenPo.waitForCertManagerToInstall();
    // kubewardenPo.kubectlShell().closeTerminal();

    // // 2 - Add kubewarden repository
    // kubewardenPo.addKwRepoClick();
    // kubewardenPo.waitForKwRepoToBeAdded();

    // 3 - Install kubewarden operator
    kubewardenPo.installOperatorBtnClick();
    kubewardenPo.waitForInstallChartPage('kubewarden-charts', 'kubewarden-controller');
    kubewardenPo.chartInstallNext();
    kubewardenPo.genericCheckboxByLabel('Enable Policy Reporter UI').set();
    kubewardenPo.chartInstallClick();
    kubewardenPo.chartInstallWaitForInstallationAndCloseTerminal(EXTENSION_CHART_CREATION, ['rancher-kubewarden-controller', 'rancher-kubewarden-crds']);

    kubewardenPo.goTo();
    kubewardenPo.waitForTitle('[data-testid="kw-dashboard-title"]', 'Welcome to Kubewarden');

    // 4 - add default policy server charts
  });

  // it('Should uninstall the extension', () => {
  //   const extensionsPo = new ExtensionsPagePo();

  //   extensionsPo.goTo();
  //   extensionsPo.extensionTabInstalledClick();

  //   // click on uninstall button on card
  //   extensionsPo.extensionCardUninstallClick(EXTENSION_NAME);
  //   extensionsPo.extensionUninstallModal().should('be.visible');
  //   extensionsPo.uninstallModaluninstallClick();
  //   extensionsPo.extensionReloadBanner().should('be.visible');

  //   // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // make sure extension card is in the available tab
  //   extensionsPo.extensionTabAvailableClick();
  //   extensionsPo.extensionCardClick(EXTENSION_NAME);
  //   extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  // });
});
