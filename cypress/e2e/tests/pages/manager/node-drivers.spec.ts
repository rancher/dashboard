import { isMatch } from 'lodash';
import NodeDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/node-drivers.po';
import NodeDriverCreateEditPo from '@/cypress/e2e/po/edit/node-driver.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/prompts/deactivateDriverDialog.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import PromptRemove from '~/cypress/e2e/po/prompts/promptRemove.po';

// Note: This test fails due to https://github.com/rancher/dashboard/issues/10275
// skipping this tests until issue has been resolved
describe.skip('Node Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new NodeDriversPagePo();
  const createDriverPage = new NodeDriverCreateEditPo();
  const clusterList = new ClusterManagerListPagePo();
  const createCluster = new ClusterManagerCreatePagePo();
  let removeDriver = false;
  let driverId = '';
  const oracleDriver = 'Oracle OCI';
  const openStackDriver = 'OpenStack';
  const cloudCaDriver = 'Cloud.ca';
  const downloadUrl1 = 'https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2294176/docker-machine-driver-cloudca_v1.0.3_linux-amd64.zip';
  const downloadUrl2 = 'https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2446837/docker-machine-driver-cloudca_v2.0.0_linux-amd64.zip';

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  it('should show the node drivers list page', () => {
    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.title().should('be.visible');
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
  });

  it('can delete an existing node driver', () => {
    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().actionMenu(cloudCaDriver).getMenuItem('Delete').click();

    cy.intercept('DELETE', '/v3/nodeDrivers/*').as('deleteDriver');

    driversPage.list().resourceTable().sortableTable().rowNames()
      .then((rows: any) => {
        const promptRemove = new PromptRemove();

        promptRemove.remove();

        cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);

        driversPage.waitForPage();
        driversPage.list().details(cloudCaDriver, 1).contains('Removing');
        driversPage.list().resourceTable().sortableTable().checkRowCount(false, rows.length - 1);
        driversPage.list().resourceTable().sortableTable().rowNames()
          .should('not.contain', cloudCaDriver);
      });
  });

  it('can create a node driver', () => {
    cy.intercept('POST', `/v3/nodedrivers`).as('createDriver');
    const requestData = {
      type:   'nodeDriver',
      active: true,
      url:    downloadUrl1
    };

    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.createDriver();
    createDriverPage.waitForPage();
    createDriverPage.downloadUrl().set(downloadUrl1);
    createDriverPage.saveCreateForm().createEditView().create();
    cy.wait('@createDriver').then(({ request, response }) => {
      removeDriver = true;
      expect(response?.statusCode).to.eq(201);
      expect(isMatch(request.body, requestData)).to.equal(true);
      driverId = response.body.id;
    });
    driversPage.list().details(downloadUrl1, 1).should('contain', 'Active');
  });

  it('can edit a node driver', () => {
    const customUrl = 'https://objects-east.cloud.ca/v1/5ef827605f884961b94881e928e7a250/ui-driver-cloudca/v2.1.2/component.js';
    const checksum = '2a55efd6d62d5f7fd27ce877d49596f4';
    const domain = 'objects-east.cloud.ca';

    cy.intercept('PUT', `/v3/nodeDrivers/*`).as('updateDriver');
    const requestData = {
      type:             'nodeDriver',
      active:           true,
      url:              downloadUrl2,
      checksum,
      uiUrl:            customUrl,
      whitelistDomains: [domain]
    };

    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().actionMenu(downloadUrl1).getMenuItem('Edit Config').click();
    createDriverPage.downloadUrl().set(downloadUrl2);
    createDriverPage.checksum().set(checksum);
    createDriverPage.customUiUrl().set(customUrl);
    createDriverPage.whitelistDomains().setValueAtIndex(domain, 0);
    createDriverPage.saveCreateForm().createEditView().save();
    cy.wait('@updateDriver').then(({ request, response }) => {
      removeDriver = true;
      expect(response?.statusCode).to.eq(200);
      expect(isMatch(request.body, requestData)).to.equal(true);
    });

    driversPage.list().details(cloudCaDriver, 1).should('contain', 'Downloading');
    driversPage.list().details(cloudCaDriver, 1).contains('Active', { timeout: 15000 });

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(cloudCaDriver, 'be.visible').invoke('index').then((index) => {
      createCluster.selectCreate(index);
    });
    createCluster.waitForPage('type=cloudca');
    createCluster.mastheadTitle().should('contain', cloudCaDriver);
  });

  it('can deactivate driver', () => {
    const requestData = { };

    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(downloadUrl2, 1).should('contain', 'Active');
    driversPage.list().details(downloadUrl2, 2).find('span')
      .invoke('text')
      .then((t) => {
        cy.intercept('POST', `/v3/nodeDrivers/${ t }?action=deactivate`).as('deactivateDriver');

        driversPage.list().actionMenu(downloadUrl2).getMenuItem('Deactivate').click();
        const deactivateDialog = new DeactivateDriverDialogPo();

        deactivateDialog.deactivate();
      });

    cy.wait('@deactivateDriver').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(isMatch(request.body, requestData)).to.equal(true);
    });

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(cloudCaDriver, 'not.exist');
  });

  it('can activate driver', () => {
    const requestData = { };

    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(downloadUrl2, 2).find('span').invoke('text')
      .then((t) => {
        cy.intercept('POST', `/v3/nodeDrivers/${ t }?action=activate`).as('activateDriver');

        driversPage.list().actionMenu(downloadUrl2).getMenuItem('Activate').click();
      });
    cy.wait('@activateDriver').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(isMatch(request.body, requestData)).to.equal(true);
    });

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(cloudCaDriver, 'exist');
  });

  it('can activate drivers in bulk', () => {
    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(oracleDriver, 1).should('contain', 'Inactive');
    driversPage.list().details(openStackDriver, 1).should('contain', 'Inactive');
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(oracleDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(openStackDriver)
      .set();

    cy.intercept('POST', '/v3/nodeDrivers/oci?action=activate').as('activateOracleDriver');
    cy.intercept('POST', '/v3/nodeDrivers/openstack?action=activate').as('activateopenStackDriver');

    driversPage.list().activate().click();
    cy.wait('@activateopenStackDriver').its('response.statusCode').should('eq', 200);
    cy.wait('@activateOracleDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().details(oracleDriver, 1).should('contain', 'Active');
    driversPage.list().details(openStackDriver, 1).should('contain', 'Active');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(oracleDriver, 'exist');
    createCluster.gridElementExistanceByName(openStackDriver, 'exist');
  });

  // it.skip('can deactivate drivers in bulk', () => {
  //   // Skipping this test until issue is resolved https://github.com/rancher/dashboard/issues/10718
  //   NodeDriversPagePo.navTo();
  //   driversPage.waitForPage();
  //   driversPage.list().details(oracleDriver, 1).should('contain', 'Active');
  //   driversPage.list().details(openStackDriver, 1).should('contain', 'Active');
  //   driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(oracleDriver)
  //     .set();
  //   driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(openStackDriver)
  //     .set();
  //   driversPage.list().resourceTable().sortableTable().bulkActionDropDownOpen();
  //   driversPage.list().resourceTable().sortableTable().bulkActionDropDownButton('Deactivate')
  //     .click();

  //   cy.intercept('POST', '/v3/nodeDrivers/oci?action=deactivate').as('deactivateOracleDriver');
  //   cy.intercept('POST', '/v3/nodeDrivers/openstack?action=deactivate').as('deactivateopenStackDriver');

  //   const deactivateDialog = new DeactivateDriverDialogPo();

  //   deactivateDialog.deactivate();
  //   cy.wait('@deactivateopenStackDriver').its('response.statusCode').should('eq', 200);
  //   cy.wait('@deactivateOracleDriver').its('response.statusCode').should('eq', 200);
  //   driversPage.list().details(oracleDriver, 1).should('contain', 'Inactive');
  //   driversPage.list().details(openStackDriver, 1).should('contain', 'Inactive');

  //   // check options on cluster create page
  //   ClusterManagerListPagePo.navTo();
  //   clusterList.waitForPage();
  //   clusterList.createCluster();
  //   createCluster.waitForPage();
  //   createCluster.gridElementExistanceByName(oracleDriver, 'not.exist');
  //   createCluster.gridElementExistanceByName(openStackDriver, 'not.exist');
  // });

  it('can delete drivers in bulk', () => {
    NodeDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(oracleDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(openStackDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownOpen();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownButton('Delete')
      .click();

    cy.intercept('DELETE', '/v3/nodeDrivers/oci').as('deleteOracleDriver');
    cy.intercept('DELETE', '/v3/nodeDrivers/openstack').as('deleteopenStackDriver');

    driversPage.list().resourceTable().sortableTable().rowNames()
      .then((rows: any) => {
        const promptRemove = new PromptRemove();

        promptRemove.remove();

        cy.wait('@deleteopenStackDriver').its('response.statusCode').should('eq', 200);
        cy.wait('@deleteOracleDriver').its('response.statusCode').should('eq', 200);

        driversPage.waitForPage();
        driversPage.list().details(openStackDriver, 1).contains('Removing');
        driversPage.list().resourceTable().sortableTable().checkRowCount(false, rows.length - 2);
        driversPage.list().resourceTable().sortableTable().rowNames()
          .should('not.contain', openStackDriver)
          .and('not.contain', oracleDriver);
      });
  });

  after(() => {
    if (removeDriver) {
      cy.deleteRancherResource('v3', 'nodeDrivers', driverId);
    }
  });
});
