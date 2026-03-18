import KontainerDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/kontainer-drivers.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/prompts/deactivateDriverDialog.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

describe('Kontainer Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new KontainerDriversPagePo();

  // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for list of example drivers
  const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64';
  let removeDriver = false;
  let driverId = '';
  const exampleDriver = 'Example';

  before(() => {
    cy.login();

    // Clean up any existing driver with the same URL to avoid 409 conflicts
    cy.getRancherResource('v3', 'kontainerdrivers').then((resp: Cypress.Response<any>) => {
      const existingDriver = resp.body.data?.find((driver: any) => driver.url === downloadUrl);

      if (existingDriver) {
        cy.deleteRancherResource('v3', 'kontainerDrivers', existingDriver.id);
      }
    });
  });

  it('should show the cluster drivers list page', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.title().should('be.visible');
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
  });

  it('can create a driver via API and see it listed', () => {
    // Create driver via API since the create UI has been removed
    cy.createRancherResource('v3', 'kontainerdrivers', {
      type:   'kontainerDriver',
      active: true,
      url:    downloadUrl
    }).then((resp: Cypress.Response<any>) => {
      driverId = resp.body.id;
      removeDriver = true;
    });

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    driversPage.list().details(exampleDriver, 1).contains('Active', { timeout: 60000 });
  });

  it('will show error if could not deactivate driver', () => {
    driversPage.list().details(exampleDriver, 1).should('contain', 'Active');

    cy.intercept('POST', `/v3/kontainerDrivers/${ driverId }?action=deactivate`, {
      statusCode: 500,
      body:       { message: `Could not deactivate driver` }
    }).as('deactivationError');

    driversPage.list().actionMenu(downloadUrl).getMenuItem('Deactivate').click();
    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();

    cy.wait('@deactivationError').then(() => {
      deactivateDialog.errorBannerContent('Could not deactivate driver').should('exist').and('be.visible');
    });
    deactivateDialog.cancel();
  });

  it('can deactivate driver', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

    cy.intercept('POST', `/v3/kontainerDrivers/*?action=deactivate`).as('deactivateDriver');

    driversPage.list().actionMenu(downloadUrl).getMenuItem('Deactivate').click();
    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();

    cy.wait('@deactivateDriver').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
    });
  });

  it('can delete a driver', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

    cy.intercept('DELETE', '/v3/kontainerDrivers/*', {
      statusCode: 200,
      body:       { }
    }).as('deleteDriver');

    driversPage.list().actionMenu(exampleDriver).getMenuItem('Delete').click();

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

  after(() => {
    if (removeDriver) {
      cy.deleteRancherResource('v3', 'kontainerDrivers', driverId);
    }
  });
});

describe('Visual Testing', { tags: ['@percy', '@manager', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.applyDefaultTestTheme();
  });

  it('should display kontainer drivers list page', () => {
    const driversPage = new KontainerDriversPagePo();

    KontainerDriversPagePo.goTo('_');
    driversPage.checkIsCurrentPage();

    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    driversPage.list().resourceTable().sortableTable().noRowsShouldNotExist();

    // hide elements before taking percy snapshot
    cy.hideElementBySelector('[data-testid="nav_header_showUserMenu"]', '[data-testid="type-count"]');
    // takes percy snapshot.
    cy.percySnapshot('kontainer drivers list page');
  });
});
