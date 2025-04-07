import { isMatch } from 'lodash';
import KontainerDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/kontainer-drivers.po';
import KontainerDriverEditPo from '@/cypress/e2e/po/edit/kontainer-driver.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/prompts/deactivateDriverDialog.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

describe('Kontainer Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new KontainerDriversPagePo();
  const createDriverPage = new KontainerDriverEditPo();
  const clusterList = new ClusterManagerListPagePo();
  const createCluster = new ClusterManagerCreatePagePo();

  // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for list of example drivers
  const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64'; // description can be used as name to find correct element
  const downloadUrlUpdated = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy2-linux-amd64';
  let removeDriver = false;
  let driverId = '';
  const oracleDriver = 'Oracle OKE';
  const googleDriver = 'Google GKE';
  const linodeDriver = 'Linode LKE';
  const tencentDriver = 'Tencent TKE';
  const exampleDriver = 'Example';
  const amazonDriver = 'Amazon EKS';
  const azureDriver = 'Azure AKS';

  before(() => {
    cy.login();
  });

  it('should show the cluster drivers list page', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.title().should('be.visible');
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
  });

  it('can refresh kubernetes metadata', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
    driversPage.refreshKubMetadata().click({ force: true });
    cy.wait('@refresh').its('response.statusCode').should('eq', 200);
  });

  it('can create new driver', () => {
    cy.intercept('POST', `/v3/kontainerdrivers`).as('createRequest');
    const requestData = {
      type:   'kontainerDriver',
      active: true,
      url:    downloadUrl
    };

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.createDriver();

    createDriverPage.waitForPage();

    createDriverPage.downloadUrl().set(downloadUrl);
    createDriverPage.saveCreateForm().createEditView().create();

    cy.wait('@createRequest').then(({ request, response }) => {
      removeDriver = true;
      expect(response?.statusCode).to.eq(201);
      expect(isMatch(request.body, requestData)).to.equal(true);
      driverId = response?.body.id;
    });

    driversPage.list().details(exampleDriver, 1).should('contain', 'Activating');
    driversPage.list().details(exampleDriver, 1).contains('Active', { timeout: 60000 });

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName('example', 'exist').invoke('index').then((index) => {
      createCluster.selectKubeProvider(index);
    });
    createCluster.waitForPage('type=example');
    createCluster.mastheadTitle().should('contain', 'example');
  });

  it('will show error if could not deactivate driver', () => {
    cy.intercept('POST', '/v3/kontainerDrivers/googlekubernetesengine?action=deactivate', {
      statusCode: 500,
      body:       { message: `Could not deactivate driver` }
    }).as('deactivationError');

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(googleDriver, 1).should('contain', 'Active');

    driversPage.list().actionMenu(googleDriver).getMenuItem('Deactivate').click();
    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();

    cy.wait('@deactivationError').then(() => {
      deactivateDialog.errorBannerContent('Could not deactivate driver').should('exist').and('be.visible');
    });
    deactivateDialog.cancel();
  });

  it('can deactivate driver', () => {
    const requestData = { };

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();

    cy.intercept('POST', `/v3/kontainerDrivers/*?action=deactivate`).as('deactivateDriver');

    driversPage.list().actionMenu(downloadUrl).getMenuItem('Deactivate').click();
    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();

    cy.wait('@deactivateDriver').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(isMatch(request.body, requestData)).to.equal(true);
    });

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName('example', 'not.exist');
  });

  it('can activate driver', () => {
    const requestData = { };

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();

    cy.intercept('POST', `/v3/kontainerDrivers/*?action=activate`).as('activateDriver');

    driversPage.list().actionMenu(downloadUrl).getMenuItem('Activate').click();

    cy.wait('@activateDriver').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(isMatch(request.body, requestData)).to.equal(true);
    });

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName('example', 'exist');
  });

  it('will show error if could not activate driver', () => {
    cy.intercept('POST', '/v3/kontainerDrivers/tencentkubernetesengine?action=activate', {
      statusCode: 500,
      body:       { message: `Could not activate driver` }
    }).as('activationError');

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(tencentDriver, 1).should('contain', 'Inactive');

    driversPage.list().actionMenu(tencentDriver).getMenuItem('Activate').click();

    cy.wait('@activationError').then(() => {
      cy.get('.growl-text').contains('Could not activate driver').should('be.visible');
    });
  });

  it('can edit a cluster driver', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().actionMenu(downloadUrl).getMenuItem('Edit Config').click();
    createDriverPage.downloadUrl().set(downloadUrlUpdated);
    cy.intercept('PUT', '/v3/kontainerDrivers/*').as('updateDriver');
    createDriverPage.saveCreateForm().createEditView().save();
    cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().details(downloadUrlUpdated, 1).should('contain', 'Active');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName('example', 'exist');
  });

  it('can deactivate drivers in bulk', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(amazonDriver, 1).scrollIntoView().should('contain', 'Active');
    driversPage.list().details(azureDriver, 1).scrollIntoView().should('contain', 'Active');
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(amazonDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(azureDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownOpen();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownButton('Deactivate')
      .click();

    cy.intercept('POST', '/v3/kontainerDrivers/amazonelasticcontainerservice?action=deactivate').as('deactivateAmazonDriver');
    cy.intercept('POST', '/v3/kontainerDrivers/azurekubernetesservice?action=deactivate').as('deactivateAzureDriver');

    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();
    cy.wait('@deactivateAmazonDriver').its('response.statusCode').should('eq', 200);
    cy.wait('@deactivateAzureDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().details(amazonDriver, 1).should('contain', 'Inactive');
    driversPage.list().details(azureDriver, 1).should('contain', 'Inactive');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(amazonDriver, 'not.exist');
    createCluster.gridElementExistanceByName(azureDriver, 'not.exist');
  });

  it('can activate drivers in bulk', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(amazonDriver, 1).should('contain', 'Inactive');
    driversPage.list().details(azureDriver, 1).should('contain', 'Inactive');
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(amazonDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(azureDriver)
      .set();

    cy.intercept('POST', '/v3/kontainerDrivers/amazonelasticcontainerservice?action=activate').as('activateAmazonDriver');
    cy.intercept('POST', '/v3/kontainerDrivers/azurekubernetesservice?action=activate').as('activateAzureDriver');

    driversPage.list().activate().click();
    cy.wait('@activateAmazonDriver').its('response.statusCode').should('eq', 200);
    cy.wait('@activateAzureDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().details(amazonDriver, 1).should('contain', 'Active');
    driversPage.list().details(azureDriver, 1).should('contain', 'Active');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(amazonDriver, 'exist');
    createCluster.gridElementExistanceByName(azureDriver, 'exist');
  });

  it('can delete drivers in bulk', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(oracleDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(linodeDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownOpen();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownButton('Delete')
      .click();

    cy.intercept('DELETE', '/v3/kontainerDrivers/oraclecontainerengine').as('deleteOracleDriver');
    cy.intercept('DELETE', '/v3/kontainerDrivers/linodekubernetesengine').as('deleteLinodeDriver');

    driversPage.list().resourceTable().sortableTable().rowNames()
      .then((rows: any) => {
        const promptRemove = new PromptRemove();

        promptRemove.remove();

        cy.wait('@deleteLinodeDriver').its('response.statusCode').should('eq', 200);
        cy.wait('@deleteOracleDriver').its('response.statusCode').should('eq', 200);

        driversPage.waitForPage();
        driversPage.list().resourceTable().sortableTable().checkRowCount(false, rows.length - 2);
        driversPage.list().resourceTable().sortableTable().rowNames()
          .should('not.contain', linodeDriver)
          .and('not.contain', oracleDriver);
      });
  });

  after(() => {
    if (removeDriver) {
      cy.deleteRancherResource('v3', 'kontainerDrivers', driverId);
    }
  });
});
