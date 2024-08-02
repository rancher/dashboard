import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import ElementalPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/elemental.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import * as jsyaml from 'js-yaml';

const EXTENSION_NAME = 'elemental';
const EXTENSION_VERSION = '1.3.1-rc7';
const EXTENSION_REPO = 'https://github.com/rancher/elemental-ui';
const EXTENSION_BRANCH = 'gh-pages';
const EXTENSION_CLUSTER_REPO_NAME = 'elemental-ui-extension';
const EXTENSION_CHART_CREATION = 'chartCreation';

const MACHINE_INV_NAME = 'machine-inventory-1';

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
});
