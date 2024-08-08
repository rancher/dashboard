import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import ElementalPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/elemental.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import * as jsyaml from 'js-yaml';

const EXTENSION_NAME = 'elemental';
const EXTENSION_VERSION = '2.0.0-rc1';
const EXTENSION_REPO = 'https://github.com/rancher/elemental-ui';
const EXTENSION_BRANCH = 'gh-pages';
const EXTENSION_CLUSTER_REPO_NAME = 'elemental-ui-extension';
const EXTENSION_CHART_CREATION = 'chartCreation';

const REG_ENDPOINT_NAME = 'reg-endpoint-1';
const REG_ENDPOINT_DEVICE_PATH = '/dev/nvme0n123';

const MACHINE_INV_NAME = 'machine-inventory-1';

const ELEMENTAL_CLUSTER_NAME = 'elemental-cluster-1';
const ELEMENTAL_CLUSTER_BANNER_TEXT = 'Matches all 1 existing Inventory of Machines';
const ELEMENTAL_CLUSTER_MACHINE_CONFIG_REF = 'MachineInventorySelectorTemplate';

const UPDATE_GROUP_NAME = 'update-group-1';
const UPDATE_GROUP_IMAGE_PATH = 'some/path';

const elementalPo = new ElementalPo();
const namespacePicker = new NamespaceFilterPo();

describe('Extensions Compatibility spec', { tags: ['@elemental', '@adminUser'] }, () => {
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

    elementalPo.goTo();
    elementalPo.waitForTitle('h1', 'OS Management');

    elementalPo.installOperatorBtnClick();

    elementalPo.waitForInstallChartPage();

    // we need to change the namespace picker in order for the install check on the list view
    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('All Namespaces');
    namespacePicker.closeDropdown();

    elementalPo.chartInstallNext();
    elementalPo.chartInstallClick();
    elementalPo.chartInstallWaitForInstallationAndCloseTerminal(EXTENSION_CHART_CREATION);

    elementalPo.goTo();
    elementalPo.waitForTitle('[data-testid="elemental-main-title"]', 'OS Management Dashboard');
  });

  it('Should create an Elemental registration endpoint', () => {
    cy.intercept('POST', 'v1/elemental.cattle.io.machineregistrations/fleet-default').as('machineRegCreation');

    elementalPo.goTo();
    elementalPo.sideMenuNavTo('Registration Endpoints');
    elementalPo.createClick();

    elementalPo.genericNameInput().set(REG_ENDPOINT_NAME);
    elementalPo.genericYamlEditor().value().then((val) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(val);

      json.config.elemental.install.device = REG_ENDPOINT_DEVICE_PATH;

      elementalPo.genericYamlEditor().set(jsyaml.dump(json));
      elementalPo.saveOrCreateResource().click();

      cy.wait('@machineRegCreation', { requestTimeout: 15000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        expect(response?.body.metadata).to.have.property('name', REG_ENDPOINT_NAME);
        expect(response?.body.spec.config.elemental.install).to.have.property('device', REG_ENDPOINT_DEVICE_PATH);
      });
    });
  });

  it('Should create an Elemental resource via YAML (Inventory of Machines)', () => {
    elementalPo.goTo();
    elementalPo.sideMenuNavTo('Inventory of Machines');
    elementalPo.createFromYamlClick();

    elementalPo.genericYamlEditor().value().then((val) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(val);

      json.metadata.name = MACHINE_INV_NAME;

      elementalPo.genericYamlEditor().set(jsyaml.dump(json));
      elementalPo.saveEditYamlForm().click();

      elementalPo.waitForPageWithSpecificUrl('/elemental/c/_/elemental.cattle.io.machineinventory');
      elementalPo.genericListView().rowWithName(MACHINE_INV_NAME).column(2).should('contain', MACHINE_INV_NAME);
    });
  });

  it('Should create an Elemental cluster, targeting all of the inventory of machines', () => {
    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('elementalClusterCreation');

    elementalPo.goTo();
    elementalPo.dashboardCreateElementalClusterClick();

    elementalPo.genericNameInput().set(ELEMENTAL_CLUSTER_NAME);
    elementalPo.elementalClusterSelectorTemplateBanner().banner().contains(ELEMENTAL_CLUSTER_BANNER_TEXT);
    elementalPo.saveOrCreateCluster().click();

    cy.wait('@elementalClusterCreation', { requestTimeout: 15000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', ELEMENTAL_CLUSTER_NAME);
      expect(response?.body.spec.rkeConfig.machinePools[0].machineConfigRef).to.have.property('kind', ELEMENTAL_CLUSTER_MACHINE_CONFIG_REF);
    });
  });

  it('Should create an Upgrade Group', () => {
    cy.intercept('POST', 'v1/elemental.cattle.io.managedosimages').as('elementalUpdateGroupCreation');

    elementalPo.goTo();
    elementalPo.dashboardCreateUpdateGroupClick();

    elementalPo.genericNameInput().set(UPDATE_GROUP_NAME);
    elementalPo.updateGroupTargetClustersSelect().toggle();
    elementalPo.updateGroupTargetClustersSelect().clickOptionWithLabel(ELEMENTAL_CLUSTER_NAME);
    elementalPo.updateGroupImageOption().set(1);

    elementalPo.genericLabeledInputByLabel('Image path').set(UPDATE_GROUP_IMAGE_PATH);
    elementalPo.saveOrCreateResource().click();

    cy.wait('@elementalUpdateGroupCreation', { requestTimeout: 15000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', UPDATE_GROUP_NAME);
      expect(response?.body.spec.clusterTargets[0]).to.have.property('clusterName', ELEMENTAL_CLUSTER_NAME);
      expect(response?.body.spec).to.have.property('osImage', UPDATE_GROUP_IMAGE_PATH);
    });
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
