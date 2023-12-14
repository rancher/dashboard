import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import RkeDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-drivers.po';
import EmberModalClusterDriverPo from '~/cypress/e2e/po/components/ember/ember-modal-add-edit-cluster-driver.po';

describe('Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new RkeDriversPagePo('local');
  const modal = new EmberModalClusterDriverPo();

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 720);
  });

  it('can navigate to drivers page', () => {
    const clusterList = new ClusterManagerListPagePo('local');
    const sideNav = new ProductNavPo();

    clusterList.goTo();
    sideNav.navToSideMenuEntryByLabel('Drivers');
    driversPage.waitForPage();
  });

  it('can refresh kubernetes metadata', () => {
    driversPage.goTo();
    cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
    driversPage.refreshKubMetadata().click({ force: true });
    cy.wait('@refresh').its('response.statusCode').should('eq', 200);
  });

  it('can create cluster driver', () => {
    // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for lsit of example drivers
    const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64';

    driversPage.goTo();
    driversPage.addClusterDriver().click();
    modal.input().set(downloadUrl, 0);
    cy.intercept('POST', '/v3/kontainerdriver').as('createDriver');
    modal.create();
    cy.wait('@createDriver').its('response.statusCode').should('eq', 201);
    driversPage.list().state('Example').should('contain.text', 'Active');
  });

  it('can edit cluster driver', () => {
    // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for list of example drivers
    const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy2-linux-amd64';

    driversPage.goTo();
    driversPage.list().rowActionMenuOpen(`Example`);
    driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
    modal.input().set(downloadUrl, 0);
    cy.intercept('PUT', '/v3/kontainerDrivers/*').as('updateDriver');
    modal.save();
    cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Example').should('contain.text', 'Active');
  });

  it('can deactivate cluster driver', () => {
    driversPage.goTo();
    driversPage.list().rowActionMenuOpen(`Example`);
    driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
    cy.intercept('POST', '/v3/kontainerDrivers/*').as('deactivateDriver');
    modal.deactivate();
    cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Example').should('contain.text', 'Inactive');
  });

  it('can activate cluster driver', () => {
    driversPage.goTo();
    driversPage.list().rowActionMenuOpen(`Example`);
    cy.intercept('POST', '/v3/kontainerDrivers/*').as('activateDriver');
    driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
    cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Example').should('contain.text', 'Active');
  });

  it('can delete cluster driver', () => {
    driversPage.goTo();
    driversPage.list().rowActionMenuOpen(`Example`);
    driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
    cy.intercept('DELETE', '/v3/kontainerDrivers/*').as('deleteDriver');
    modal.delete();
    cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Example').should('not.exist');
  });

  it('can edit node driver', () => {
    cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
    driversPage.goTo();
    driversPage.tabs('Node Drivers').click();
    cy.wait('@nodeDrivers');
    driversPage.list().rowActionMenuOpen(`Cloud.ca`);
    driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
    cy.intercept('PUT', '/v3/nodeDrivers/*').as('updateDriver');
    modal.save();
    cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Cloud.ca').should('contain.text', 'Inactive');
  });

  it('can activate node driver', () => {
    cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
    driversPage.goTo();
    driversPage.tabs('Node Drivers').click();
    cy.wait('@nodeDrivers');
    driversPage.list().rowActionMenuOpen(`Cloud.ca`);
    cy.intercept('POST', '/v3/nodeDrivers/**').as('activateDriver');
    driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
    cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Cloud.ca').should('contain.text', 'Active');
  });

  it('can deactivate node driver', () => {
    cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
    driversPage.goTo();
    driversPage.tabs('Node Drivers').click();
    cy.wait('@nodeDrivers');
    driversPage.list().rowActionMenuOpen(`Cloud.ca`);
    driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
    cy.intercept('POST', '/v3/nodeDrivers/**').as('deactivateDriver');
    modal.deactivate();
    cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Cloud.ca').should('contain.text', 'Inactive');
  });

  it('can delete node driver', () => {
    cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
    driversPage.goTo();
    driversPage.tabs('Node Drivers').click();
    cy.wait('@nodeDrivers');
    driversPage.list().rowActionMenuOpen(`Cloud.ca`);
    driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
    cy.intercept('DELETE', '/v3/nodeDrivers/*').as('deleteDriver');
    modal.delete();
    cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().state('Cloud.ca').should('not.exist');
  });
});
