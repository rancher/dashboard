import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ResourceSearchDialog from '@/cypress/e2e/po/prompts/ResourceSearchDialog.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';

const clusterDashboard = new ClusterDashboardPagePo('local');

describe('Cluster Dashboard', { testIsolation: 'off', tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();

    ClusterDashboardPagePo.navTo();
  });

  it('can show resource search dialog', () => {
    // Open the resource search
    clusterDashboard.clusterActionsHeader().resourceSearchButton().click();

    const dialog = new ResourceSearchDialog();

    dialog.checkExists();
    dialog.checkVisible();

    dialog.searchBox().type('ConfigMap');

    dialog.results().should('have.length', 1);
    dialog.results().first().should('have.text', 'ConfigMaps');

    dialog.close();

    dialog.checkNotExists();
  });

  it('can show resource dialog when namespace chooser is open', () => {
    const namespacePicker = new NamespaceFilterPo();

    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('Only User Namespaces');
    namespacePicker.isChecked('Only User Namespaces');

    // Namespace filter is still open
    const dialog = new ResourceSearchDialog();

    // Open the resource search
    dialog.open();

    dialog.checkExists();
    dialog.checkVisible();

    dialog.searchBox().type('ConfigMap');

    dialog.results().should('have.length', 1);
    dialog.results().first().should('have.text', 'ConfigMaps');

    dialog.results().first().click();

    const configMapPage = new ConfigMapPagePo('local');

    configMapPage.waitForPage();

    dialog.checkNotExists();
  });
});
