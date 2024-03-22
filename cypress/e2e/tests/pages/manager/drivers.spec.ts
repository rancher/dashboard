import RkeDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-drivers.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';

describe('Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new RkeDriversPagePo();
  const emberModal = new EmberModalPo();

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  describe('Cluster Drivers', () => {
    it('can refresh kubernetes metadata', () => {
      RkeDriversPagePo.navTo();
      driversPage.waitForPage();
      cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
      driversPage.refreshKubMetadata().click({ force: true });
      cy.wait('@refresh').its('response.statusCode').should('eq', 200);
    });

    it('can create a cluster driver', () => {
    // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for lsit of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64';

      RkeDriversPagePo.navTo();
      driversPage.waitForPage();
      driversPage.addClusterDriver().click();
      driversPage.createEditClusterDriver().formInput(2).set(downloadUrl);
      cy.intercept('POST', '/v3/kontainerdriver').as('createDriver');
      driversPage.createEditClusterDriver().create();
      cy.wait('@createDriver').its('response.statusCode').should('eq', 201);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can edit a cluster driver', () => {
    // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for list of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy2-linux-amd64';

      RkeDriversPagePo.navTo();
      driversPage.waitForPage();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
      driversPage.createEditClusterDriver().formInput(2).set(downloadUrl);
      cy.intercept('PUT', '/v3/kontainerDrivers/*').as('updateDriver');
      driversPage.createEditClusterDriver().save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can deactivate a cluster driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.waitForPage();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('deactivateDriver');
      emberModal.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Inactive');
    });

    it('can activate a cluster driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.waitForPage();
      driversPage.list().rowActionMenuOpen(`Example`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('activateDriver');
      driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can delete a cluster driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.waitForPage();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/kontainerDrivers/*').as('deleteDriver');
      emberModal.delete();
      cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('not.exist');
    });
  });

  // Note: This test fails due to https://github.com/rancher/dashboard/issues/10275
  // skipping this tests until issue has been resolved
  describe.skip('Node Drivers', () => {
    it('can delete an existing node driver', () => {
      RkeDriversPagePo.navTo();
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      driversPage.tabs('Node Drivers').should('be.visible').click();
      cy.wait('@nodeDrivers');

      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/nodeDrivers/*').as('deleteDriver');
      emberModal.delete();
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
      driversPage.createEditNodeDriver().formInput(2).set(downloadUrl);
      driversPage.createEditNodeDriver().formInput(3).set(customUrl);
      driversPage.createEditNodeDriver().formInput(4).set(checksum);
      driversPage.createEditNodeDriver().addDomainButton();
      driversPage.createEditNodeDriver().formInput(5).set(domain);
      cy.intercept('POST', '/v3/nodedriver').as('createNodeDriver');
      driversPage.createEditClusterDriver().create();
      cy.wait('@createNodeDriver').its('response.statusCode').should('eq', 201);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Active');
    });

    it('can edit a node driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
      cy.intercept('PUT', '/v3/nodeDrivers/*').as('updateDriver');
      driversPage.createEditClusterDriver().save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Active');
    });

    it('can deactivate a node driver', () => {
      RkeDriversPagePo.navTo();
      driversPage.tabs('Node Drivers').should('be.visible').click();
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/nodeDrivers/**').as('deactivateDriver');
      emberModal.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
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
  });
});
