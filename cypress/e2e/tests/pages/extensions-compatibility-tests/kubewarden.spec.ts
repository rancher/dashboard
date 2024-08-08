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

const REG_ENDPOINT_NAME = 'reg-endpoint-1';
const REG_ENDPOINT_DEVICE_PATH = '/dev/nvme0n123';

const MACHINE_INV_NAME = 'machine-inventory-1';

const ELEMENTAL_CLUSTER_NAME = 'elemental-cluster-1';
const ELEMENTAL_CLUSTER_BANNER_TEXT = 'Matches all 1 existing Inventory of Machines';
const ELEMENTAL_CLUSTER_MACHINE_CONFIG_REF = 'MachineInventorySelectorTemplate';

const UPDATE_GROUP_NAME = 'update-group-1';
const UPDATE_GROUP_IMAGE_PATH = 'some/path';

const kubewardenPo = new KubewardenPo();
const namespacePicker = new NamespaceFilterPo();

describe('Extensions Compatibility spec', { tags: ['@kubewarden', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('add extension repository', () => {
    // // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.addExtensionsRepositoryDirectLink(EXTENSION_REPO, EXTENSION_BRANCH, EXTENSION_CLUSTER_REPO_NAME, false);
  });

  it('Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionLabel(EXTENSION_VERSION);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should setup all of the needed backend parts', () => {
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as(EXTENSION_CHART_CREATION);

    kubewardenPo.goTo();
    kubewardenPo.waitForTitle('h1', 'Kubewarden');

    // we need to change the namespace picker in order for the install check on the list view
    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('All Namespaces');
    namespacePicker.closeDropdown();

    // start install steps
    kubewardenPo.startBackendInstallClick();

    // 1 - install cert manager
    kubewardenPo.openTerminalClick();
    kubewardenPo.kubectlShell().executeCommand('apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml');
    kubewardenPo.waitForCertManagerToInstall();
    kubewardenPo.kubectlShell().closeTerminal();

    // 2 - Add kubewarden repository
    kubewardenPo.addKwRepoClick();
    kubewardenPo.waitForKwRepoToBeAdded();

    // 2 - Install kubewarden operator
    kubewardenPo.installOperatorBtnClick();
    kubewardenPo.waitForInstallChartPage('kubewarden-charts', 'kubewarden-controller');
    kubewardenPo.chartInstallNext();

    // // we need to change the namespace picker in order for the install check on the list view
    // namespacePicker.toggle();
    // namespacePicker.clickOptionByLabel('All Namespaces');
    // namespacePicker.closeDropdown();

    // kubewardenPo.chartInstallNext();
    // kubewardenPo.chartInstallClick();
    // kubewardenPo.chartInstallWaitForInstallationAndCloseTerminal(EXTENSION_CHART_CREATION);

    // kubewardenPo.goTo();
    // kubewardenPo.waitForTitle('[data-testid="elemental-main-title"]', 'OS Management Dashboard');
  });

  // it('Should create an Elemental registration endpoint', () => {
  //   cy.intercept('POST', 'v1/elemental.cattle.io.machineregistrations/fleet-default').as('machineRegCreation');

  //   kubewardenPo.goTo();
  //   kubewardenPo.sideMenuNavTo('Registration Endpoints');
  //   kubewardenPo.createClick();

  //   kubewardenPo.genericNameInput().set(REG_ENDPOINT_NAME);
  //   kubewardenPo.genericYamlEditor().value().then((val) => {
  //     // convert yaml into json to update values
  //     const json: any = jsyaml.load(val);

  //     json.config.elemental.install.device = REG_ENDPOINT_DEVICE_PATH;

  //     kubewardenPo.genericYamlEditor().set(jsyaml.dump(json));
  //     kubewardenPo.saveOrCreateResource().click();

  //     cy.wait('@machineRegCreation', { requestTimeout: 15000 }).then(({ response }) => {
  //       expect(response?.statusCode).to.eq(201);
  //       expect(response?.body.metadata).to.have.property('name', REG_ENDPOINT_NAME);
  //       expect(response?.body.spec.config.elemental.install).to.have.property('device', REG_ENDPOINT_DEVICE_PATH);
  //     });
  //   });
  // });

  // it('Should create an Elemental resource via YAML (Inventory of Machines)', () => {
  //   function poolingSchemaDefinition() {
  //     cy
  //       .request('GET', 'v1/schemaDefinitions/elemental.cattle.io.machineinventory')
  //       .then((resp) => {
  //         if (resp.status === 200) {
  //           return;
  //         }

  //         cy.wait(5000); // let's wait for a bit so that we don't overload the server
  //         poolingSchemaDefinition();
  //       });
  //   }

  //   kubewardenPo.goTo();
  //   kubewardenPo.sideMenuNavTo('Inventory of Machines');
  //   // after we hit create from YAML we need to pool for the schemaDefinition since
  //   // that takes while to be available https://docs.cypress.io/api/commands/request#Request-Polling
  //   kubewardenPo.createFromYamlClick().then(poolingSchemaDefinition);

  //   kubewardenPo.genericYamlEditor().value().then((val) => {
  //     // convert yaml into json to update values
  //     const json: any = jsyaml.load(val);

  //     json.metadata.name = MACHINE_INV_NAME;

  //     kubewardenPo.genericYamlEditor().set(jsyaml.dump(json));
  //     kubewardenPo.saveEditYamlForm().click();

  //     kubewardenPo.waitForPageWithSpecificUrl('/elemental/c/_/elemental.cattle.io.machineinventory');
  //     kubewardenPo.genericListView().rowWithName(MACHINE_INV_NAME).column(2).should('contain', MACHINE_INV_NAME);
  //   });
  // });

  // it('Should create an Elemental cluster, targeting all of the inventory of machines', () => {
  //   cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('elementalClusterCreation');

  //   kubewardenPo.goTo();
  //   kubewardenPo.dashboardCreateElementalClusterClick();

  //   kubewardenPo.genericNameInput().set(ELEMENTAL_CLUSTER_NAME);
  //   kubewardenPo.elementalClusterSelectorTemplateBanner().banner().contains(ELEMENTAL_CLUSTER_BANNER_TEXT);
  //   kubewardenPo.saveOrCreateCluster().click();

  //   cy.wait('@elementalClusterCreation', { requestTimeout: 15000 }).then(({ response }) => {
  //     expect(response?.statusCode).to.eq(201);
  //     expect(response?.body.metadata).to.have.property('name', ELEMENTAL_CLUSTER_NAME);
  //     expect(response?.body.spec.rkeConfig.machinePools[0].machineConfigRef).to.have.property('kind', ELEMENTAL_CLUSTER_MACHINE_CONFIG_REF);
  //   });
  // });

  // it('Should create an Upgrade Group', () => {
  //   cy.intercept('POST', 'v1/elemental.cattle.io.managedosimages').as('elementalUpdateGroupCreation');

  //   kubewardenPo.goTo();
  //   kubewardenPo.dashboardCreateUpdateGroupClick();

  //   kubewardenPo.genericNameInput().set(UPDATE_GROUP_NAME);
  //   kubewardenPo.updateGroupTargetClustersSelect().toggle();
  //   kubewardenPo.updateGroupTargetClustersSelect().clickOptionWithLabel(ELEMENTAL_CLUSTER_NAME);
  //   kubewardenPo.updateGroupImageOption().set(1);

  //   kubewardenPo.genericLabeledInputByLabel('Image path').set(UPDATE_GROUP_IMAGE_PATH);
  //   kubewardenPo.saveOrCreateResource().click();

  //   cy.wait('@elementalUpdateGroupCreation', { requestTimeout: 15000 }).then(({ response }) => {
  //     expect(response?.statusCode).to.eq(201);
  //     expect(response?.body.metadata).to.have.property('name', UPDATE_GROUP_NAME);
  //     expect(response?.body.spec.clusterTargets[0]).to.have.property('clusterName', ELEMENTAL_CLUSTER_NAME);
  //     expect(response?.body.spec).to.have.property('osImage', UPDATE_GROUP_IMAGE_PATH);
  //   });
  // });

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
