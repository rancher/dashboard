import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import NeuvectorPo from '~/cypress/e2e/po/extensions/neuvector/neuvector.utils';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { MEDIUM_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

const EXTENSION_NAME = 'neuvector-ui-ext';
const EXTENSION_TITLE = 'NeuVector UI Extension';
const EXTENSION_REPO = 'https://github.com/neuvector/manager-ext';
const EXTENSION_BRANCH = 'gh-pages';
const EXTENSION_CLUSTER_REPO_NAME = 'neuvector-ui-extension';
const EXTENSION_CHART_CREATION = 'chartCreation';

const neuvectorPo = new NeuvectorPo();
const namespaceFilter = new NamespaceFilterPo();

describe('Extensions Compatibility spec', { tags: ['@neuvector', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('add extension repository', () => {
    // // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.addExtensionsRepositoryDirectLink(EXTENSION_REPO, EXTENSION_BRANCH, EXTENSION_CLUSTER_REPO_NAME, true);
    // let's wait a bit so that the repo is available in extensions screen
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  });

  it('Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // There's only one version available... we can just click install
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible', MEDIUM_TIMEOUT_OPT);
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_TITLE);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should setup all of the needed backend parts', () => {
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as(EXTENSION_CHART_CREATION);

    neuvectorPo.dashboard().goTo();
    neuvectorPo.dashboard().waitForTitlePreControllerInstall();
    neuvectorPo.dashboard().controllerInstallBtnClick();

    // we need to change the namespace picker in order for the install check on the list view
    namespaceFilter.toggle();
    namespaceFilter.clickOptionByLabel('All Namespaces');
    namespaceFilter.closeDropdown();

    neuvectorPo.chartInstallPage().nextPage();
    neuvectorPo.chartInstallPage().installChart();

    // with the install of the neuvector controller, all pods are up, but the extension access depends on the service proxy
    // being up as well and that takes some time that we don't really know how much...
    // the extension does an "auth" request https://github.com/neuvector/manager-ext/blame/main/pkg/neuvector-ui-ext/plugins/dashboard-class.js#L5-L15 to assertain this
    // otherwise it throws an error: "Auth error" or "Authentication error"
    const maxPollingRetries = 18;
    let pollingCounter = 0;

    function pollingAuthControlRequest() {
      cy
        .request({
          url:              'k8s/clusters/local/api/v1/namespaces/cattle-neuvector-system/services/https:neuvector-service-webui:8443/proxy/auth',
          method:           'POST',
          failOnStatusCode: false,
          body:             {
            username:        '',
            password:        '',
            isRancherSSOUrl: true
          }
        })
        .then((resp) => {
          pollingCounter++;

          if (resp.status === 200 || pollingCounter === maxPollingRetries) {
            return;
          }

          if (pollingCounter === maxPollingRetries) {
            throw new Error('schemaDefinition polling failed');
          }

          // let's wait for a bit so that we don't overload the server
          // with requests
          cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
          pollingAuthControlRequest();
        });
    }

    neuvectorPo.appsPage().waitForInstallCloseTerminal(EXTENSION_CHART_CREATION, ['neuvector-crd', 'neuvector']).then(pollingAuthControlRequest);

    neuvectorPo.dashboard().goTo();
    neuvectorPo.dashboard().waitForTitleAfterControllerInstall();
  });

  it('Should uninstall the extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();
    extensionsPo.extensionReloadBanner().should('be.visible');

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  });
});
