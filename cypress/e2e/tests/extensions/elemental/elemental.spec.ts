import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import ElementalPo from '~/cypress/e2e/po/extensions/elemental/elemental.utils';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import * as jsyaml from 'js-yaml';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import { MEDIUM_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

const EXTENSION_NAME = 'elemental';
const EXTENSION_VERSION = '2.0.0-rc2';
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
const namespaceFilter = new NamespaceFilterPo();

describe('Extensions Compatibility spec', { tags: ['@elemental', '@adminUser'] }, () => {
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

    // select version and click install
    extensionsPo.installModalSelectVersionLabel(EXTENSION_VERSION);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible', MEDIUM_TIMEOUT_OPT);
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should setup all of the needed backend parts', () => {
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as(EXTENSION_CHART_CREATION);

    elementalPo.dashboard().goTo();
    elementalPo.dashboard().waitForTitle();

    elementalPo.dashboard().installOperator();
    elementalPo.chartInstallPage().waitForChartPage('rancher-charts', 'elemental');

    // we need to change the namespace picker in order for the install check on the list view
    namespaceFilter.toggle();
    namespaceFilter.clickOptionByLabel('All Namespaces');
    namespaceFilter.closeDropdown();

    elementalPo.chartInstallPage().nextPage();
    elementalPo.chartInstallPage().installChart();
    elementalPo.appsPage().waitForInstallCloseTerminal(EXTENSION_CHART_CREATION, ['elemental-operator-crds', 'elemental-operator']);

    elementalPo.dashboard().goTo();
    cy.get('[data-testid="elemental-main-title"]').invoke('text').should('contain', 'OS Management Dashboard');
  });

  it('Should create an Elemental registration endpoint', () => {
    cy.intercept('POST', 'v1/elemental.cattle.io.machineregistrations/fleet-default').as('machineRegCreation');

    elementalPo.dashboard().goTo();
    elementalPo.dashboard().productNav().navToSideMenuEntryByLabel('Registration Endpoints');

    elementalPo.genericResourceList().masthead().create();
    elementalPo.genericNameNsDescription().name().set(REG_ENDPOINT_NAME);
    elementalPo.genericCodeMirror().value()
      .then((val) => {
      // convert yaml into json to update values
        const json: any = jsyaml.load(val);

        json.config.elemental.install.device = REG_ENDPOINT_DEVICE_PATH;

        elementalPo.genericCodeMirror().set(jsyaml.dump(json));
        elementalPo.genericResourceDetail().cruResource().saveOrCreate().click();

        cy.wait('@machineRegCreation', { requestTimeout: 15000 }).then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(response?.body.metadata).to.have.property('name', REG_ENDPOINT_NAME);
          expect(response?.body.spec.config.elemental.install).to.have.property('device', REG_ENDPOINT_DEVICE_PATH);
        });
      });
  });

  it('Should create an Elemental resource via YAML (Inventory of Machines)', () => {
    const maxPollingRetries = 36;
    let pollingCounter = 0;

    function pollingSchemaDefinition() {
      cy
        .request({
          url:              'v1/schemaDefinitions/elemental.cattle.io.machineinventory',
          method:           'GET',
          failOnStatusCode: false
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
          cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
          pollingSchemaDefinition();
        });
    }

    elementalPo.dashboard().goTo();
    elementalPo.dashboard().productNav().navToSideMenuEntryByLabel('Inventory of Machines');

    // after we hit create from YAML we need to pool for the schemaDefinition since
    // that takes while to be available https://docs.cypress.io/api/commands/request#Request-Polling
    elementalPo.genericResourceList().masthead().createYaml().then(pollingSchemaDefinition);

    elementalPo.genericResourceDetail().resourceYaml().codeMirror().value()
      .then((val) => {
      // convert yaml into json to update values
        const json: any = jsyaml.load(val);

        json.metadata.name = MACHINE_INV_NAME;

        elementalPo.genericResourceDetail().resourceYaml().codeMirror().set(jsyaml.dump(json));
        elementalPo.genericResourceDetail().resourceYaml().saveOrCreate().click();

        elementalPo.genericPage('/elemental/c/_/elemental.cattle.io.machineinventory').waitForPage();
        elementalPo.genericResourceList().resourceTable().sortableTable().rowWithName(MACHINE_INV_NAME)
          .column(2)
          .should('contain', MACHINE_INV_NAME);
      });
  });

  it('Should create an Elemental cluster, targeting all of the inventory of machines', () => {
    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('elementalClusterCreation');

    elementalPo.dashboard().goTo();
    elementalPo.dashboard().createElementalCluster();

    elementalPo.genericNameNsDescription().name().set(ELEMENTAL_CLUSTER_NAME);
    elementalPo.elementalClusterSelectorTemplateBanner().banner().contains(ELEMENTAL_CLUSTER_BANNER_TEXT);
    // hit create button
    cy.get('[data-testid="rke2-custom-create-save"]').click();

    cy.wait('@elementalClusterCreation', { requestTimeout: 15000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', ELEMENTAL_CLUSTER_NAME);
      expect(response?.body.spec.rkeConfig.machinePools[0].machineConfigRef).to.have.property('kind', ELEMENTAL_CLUSTER_MACHINE_CONFIG_REF);
    });
  });

  it('Should create an Upgrade Group', () => {
    cy.intercept('POST', 'v1/elemental.cattle.io.managedosimages').as('elementalUpdateGroupCreation');

    elementalPo.dashboard().goTo();
    elementalPo.dashboard().createUpdateGroupClick();

    elementalPo.genericNameNsDescription().name().set(UPDATE_GROUP_NAME);
    elementalPo.updateGroupTargetClustersSelect().toggle();
    elementalPo.updateGroupTargetClustersSelect().clickOptionWithLabel(ELEMENTAL_CLUSTER_NAME);
    elementalPo.updateGroupImageOption().set(1);

    LabeledInputPo.byLabel(cy.get('.dashboard-root'), 'Image path').set(UPDATE_GROUP_IMAGE_PATH);
    elementalPo.genericResourceDetail().cruResource().saveOrCreate().click();

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
