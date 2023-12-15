import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import RkeDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-drivers.po';
import EmberPromptRemove from '@/cypress/e2e/po/components/ember/ember-prompt-remove.po';
import EmberPromptDeactivate from '@/cypress/e2e/po/components/ember/ember-prompt-deactivate.po';

describe('Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new RkeDriversPagePo('local');
  const promptRemove = new EmberPromptRemove();
  const promptDeactivate = new EmberPromptDeactivate();

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 620);
  });

  describe('Cluster Drivers', () => {
    it('can navigate to drivers page', () => {
      const clusterList = new ClusterManagerListPagePo('local');
      const sideNav = new ProductNavPo();

      clusterList.goTo();
      sideNav.navToSideMenuEntryByLabel('Drivers');
      driversPage.waitForPage();
    });

    it('can refresh kubernetes metadata', () => {
      RkeDriversPagePo.navTo();
      cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
      driversPage.refreshKubMetadata().click({ force: true });
      cy.wait('@refresh').its('response.statusCode').should('eq', 200);
    });

    it('can create a cluster driver', () => {
    // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for lsit of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64';

      RkeDriversPagePo.navTo();
      driversPage.addClusterDriver().click();
      driversPage.createEditClusterDriver().input().set(downloadUrl, 0);
      cy.intercept('POST', '/v3/kontainerdriver').as('createDriver');
      driversPage.createEditClusterDriver().create();
      cy.wait('@createDriver').its('response.statusCode').should('eq', 201);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can edit a cluster driver', () => {
    // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for list of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy2-linux-amd64';

      RkeDriversPagePo.navTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
      driversPage.createEditClusterDriver().input().set(downloadUrl, 0);
      cy.intercept('PUT', '/v3/kontainerDrivers/*').as('updateDriver');
      driversPage.createEditClusterDriver().save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can deactivate a cluster driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('deactivateDriver');
      promptDeactivate.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Inactive');
    });

    it('can activate a cluster driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('activateDriver');
      driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can delete a cluster driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/kontainerDrivers/*').as('deleteDriver');
      promptRemove.delete();
      cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('not.exist');
    });
  });

  describe('Node Drivers', () => {
    it('can edit an existing node driver', () => {
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      cy.wait('@nodeDrivers');
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
      cy.intercept('PUT', '/v3/nodeDrivers/*').as('updateDriver');
      driversPage.createEditClusterDriver().save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Inactive');
    });

    it('can activate a node driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      cy.intercept('POST', '/v3/nodeDrivers/**').as('activateDriver');
      driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Active');
    });

    it('can deactivate a node driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/nodeDrivers/**').as('deactivateDriver');
      promptDeactivate.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Inactive');
    });

    it('can delete a node driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/nodeDrivers/*').as('deleteDriver');
      promptRemove.delete();
      cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('not.exist');
    });

    it('can create a node driver', () => {
      const downloadUrl = 'https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2446837/docker-machine-driver-cloudca_v2.0.0_linux-amd64.zip';
      const customUrl = 'https://objects-east.cloud.ca/v1/5ef827605f884961b94881e928e7a250/ui-driver-cloudca/v2.1.2/component.js';
      const checksum = '2a55efd6d62d5f7fd27ce877d49596f4';
      const domain = 'objects-east.cloud.ca';

      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      driversPage.addNodeDriver().click();
      driversPage.createEditNodeDriver().input().set(downloadUrl, 0);
      driversPage.createEditNodeDriver().input().set(customUrl, 1);
      driversPage.createEditNodeDriver().input().set(checksum, 2);
      driversPage.createEditNodeDriver().addDomain().click();
      driversPage.createEditNodeDriver().input().set(domain, 3);
      cy.intercept('POST', '/v3/nodedriver').as('createNodeDriver');
      driversPage.createEditClusterDriver().create();
      cy.wait('@createNodeDriver').its('response.statusCode').should('eq', 201);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Active');
    });
  });
});
