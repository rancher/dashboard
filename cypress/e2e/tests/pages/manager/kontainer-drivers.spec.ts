import { isMatch } from 'lodash';
import KontainerDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/kontainer-drivers.po';
import KontainerDriverEditPo from '@/cypress/e2e/po/edit/kontainer-driver.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/prompts/deactivateDriverDialog.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
// import { EXTRA_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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
  const openTelekomDriver = 'Open Telekom Cloud CCE';
  const linodeDriver = 'Linode LKE';
  const exampleDriver = 'Example';

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

  // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/15782
  // it('can refresh kubernetes metadata', () => {
  //   KontainerDriversPagePo.navTo();
  //   driversPage.waitForPage();
  //   cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
  //   driversPage.refreshKubMetadata().click({ force: true });
  //   cy.wait('@refresh', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
  // });

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

  it('can activate drivers in bulk', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(openTelekomDriver, 1).should('contain', 'Inactive');
    driversPage.list().details(oracleDriver, 1).should('contain', 'Inactive');
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(openTelekomDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(oracleDriver)
      .set();

    cy.intercept('POST', '/v3/kontainerDrivers/opentelekomcloudcontainerengine?action=activate').as('activateOpenTelekomDriver');
    cy.intercept('POST', '/v3/kontainerDrivers/oraclecontainerengine?action=activate').as('activateOracleDriver');

    driversPage.list().activate().click();
    cy.wait('@activateOpenTelekomDriver').its('response.statusCode').should('eq', 200);
    cy.wait('@activateOracleDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().details(openTelekomDriver, 1).should('contain', 'Active');
    driversPage.list().details(oracleDriver, 1).should('contain', 'Active');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(openTelekomDriver, 'exist');
    createCluster.gridElementExistanceByName(oracleDriver, 'exist');
  });

  it('will show error if could not deactivate driver', () => {
    cy.intercept('POST', '/v3/kontainerDrivers/opentelekomcloudcontainerengine?action=deactivate', {
      statusCode: 500,
      body:       { message: `Could not deactivate driver` }
    }).as('deactivationError');

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(openTelekomDriver, 1).should('contain', 'Active');

    driversPage.list().actionMenu(openTelekomDriver).getMenuItem('Deactivate').click();
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
    cy.intercept('POST', '/v3/kontainerDrivers/linodekubernetesengine?action=activate', {
      statusCode: 500,
      body:       { message: `Could not activate driver` }
    }).as('activationError');

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(linodeDriver, 1).should('contain', 'Inactive');

    driversPage.list().actionMenu(linodeDriver).getMenuItem('Activate').click();

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
    driversPage.list().details(openTelekomDriver, 1).scrollIntoView().should('contain', 'Active');
    driversPage.list().details(oracleDriver, 1).scrollIntoView().should('contain', 'Active');
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(openTelekomDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(oracleDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownOpen();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownButton('Deactivate')
      .click();

    cy.intercept('POST', '/v3/kontainerDrivers/opentelekomcloudcontainerengine?action=deactivate' ).as('deactivateTelecomDriver');
    cy.intercept('POST', '/v3/kontainerDrivers/oraclecontainerengine?action=deactivate').as('deactivateOracleDriver');

    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();
    cy.wait('@deactivateTelecomDriver').its('response.statusCode').should('eq', 200);
    cy.wait('@deactivateOracleDriver').its('response.statusCode').should('eq', 200);
    driversPage.list().details(openTelekomDriver, 1).should('contain', 'Inactive');
    driversPage.list().details(oracleDriver, 1).should('contain', 'Inactive');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(openTelekomDriver, 'not.exist');
    createCluster.gridElementExistanceByName(oracleDriver, 'not.exist');
  });

  it('can delete a driver', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    cy.intercept('DELETE', '/v3/kontainerDrivers/*', {
      statusCode: 200,
      body:       { }
    }).as('deleteDriver');
    driversPage.list().resourceTable().sortableTable().rowSelectCtlWithName(exampleDriver)
      .set();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownOpen();
    driversPage.list().resourceTable().sortableTable().bulkActionDropDownButton('Delete')
      .click();

    driversPage.list().resourceTable().sortableTable().rowNames()
      .then((rows: any) => {
        const promptRemove = new PromptRemove();

        promptRemove.remove();

        cy.wait('@deleteDriver').then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          if (response?.statusCode === 200) {
            removeDriver = false;
          }
          driversPage.waitForPage();
          driversPage.list().resourceTable().sortableTable().rowNames()
            .should('not.contain', exampleDriver);
        });
      });
  });

  after(() => {
    if (removeDriver) {
      cy.deleteRancherResource('v3', 'kontainerDrivers', driverId);
    }
  });
});
