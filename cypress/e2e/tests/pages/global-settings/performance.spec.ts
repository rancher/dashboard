import { PerformancePagePo } from '@/cypress/e2e/po/pages/global-settings/performance.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const performancePage = new PerformancePagePo();
const performanceSettingsOriginal = [];

describe('Performance', { testIsolation: 'off', tags: ['@globalSettings', '@adminUser'] }, () => {
  before('get default performance settings', () => {
    cy.login();
    HomePagePo.goTo();

    cy.getRancherResource('v1', 'management.cattle.io.settings', 'ui-performance', null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      performanceSettingsOriginal.push(body);
    });
  });

  describe('Inactivity', () => {
    it('should show the modal after 6 seconds', () => {
      PerformancePagePo.navTo();

      performancePage.inactivityCheckbox().isUnchecked();

      // Enables the inactivity timeout and sets it to 6 seconds
      performancePage.inactivityCheckbox().set();
      performancePage.inactivityCheckbox().isChecked();
      performancePage.inactivityInput().clear().type('0.10');
      performancePage.applyAndWait('inactivity=true');

      // We need to reload the page to get the new settings to take effect.
      cy.reload();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(7000); // We wait for the modal to show // FIXME: should wait for modal to open

      expect(performancePage.inactivityModalCard().getModal().should('exist'));

      expect(performancePage.inactivityModalCard().getCardTitle().should('exist'));
      expect(performancePage.inactivityModalCard().getCardBody().should('exist'));
      expect(performancePage.inactivityModalCard().getCardActions().should('exist'));

      expect(performancePage.inactivityModalCard().getCardTitle().should('contain', 'Session expired'));
      expect(performancePage.inactivityModalCard().getCardBody().should('contain', 'Your session has expired in this tab due to inactivity.'));
      expect(performancePage.inactivityModalCard().getCardBody().should('contain', 'To return to this page click “Refresh” below or refresh the browser.'));

      // // Clicking the refresh button should close the modal and restart the page
      // performancePage.inactivityModal().get("[data-testid='card-actions-slot']").contains('Refresh').click();
      expect(performancePage.inactivityModalCard().getCardActions().contains('Refresh').click());
      expect(performancePage.inactivityModalCard().shouldNotExist());
    });

    it('should reset the settings', () => {
      // INFO: We need to keep this in a separate test
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      performancePage.restoresInactivitySettings();

      // We need to reload the page to get the new settings to take effect.
      cy.reload();

      performancePage.inactivityCheckbox().isUnchecked();
    });
  });

  it('can toggle websocket notifications', () => {
    PerformancePagePo.navTo();

    // Enable websocket notifications
    performancePage.websocketCheckbox().isChecked();
    performancePage.websocketCheckbox().set();
    performancePage.websocketCheckbox().isUnchecked();
    performancePage.applyAndWait('disableWebsocketNotification-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"disableWebsocketNotification\":false');
      expect(response?.body).to.have.property('value').contains('\"disableWebsocketNotification\":false');
    });

    // Disable websocket notifications
    performancePage.websocketCheckbox().isUnchecked();
    performancePage.websocketCheckbox().set();
    performancePage.websocketCheckbox().isChecked();
    performancePage.applyAndWait('disableWebsocketNotification-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"disableWebsocketNotification\":true');
      expect(response?.body).to.have.property('value').contains('\"disableWebsocketNotification\":true');
    });
  });

  it('can toggle incremental loading', () => {
    PerformancePagePo.navTo();

    // Disable incremental loading
    performancePage.incrementalLoadingCheckbox().isChecked();
    performancePage.incrementalLoadingCheckbox().set();
    performancePage.incrementalLoadingCheckbox().isUnchecked();
    performancePage.applyAndWait('incrementalLoading-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":false');
    });

    // Enable incremental loading
    performancePage.incrementalLoadingCheckbox().isUnchecked();
    performancePage.incrementalLoadingCheckbox().set();
    performancePage.incrementalLoadingCheckbox().isChecked();
    performancePage.applyAndWait('incrementalLoading-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
    });
  });

  it('can toggle manual refresh', () => {
    PerformancePagePo.navTo();

    // Enable manual refresh
    performancePage.manualRefreshCheckbox().isUnchecked();
    performancePage.manualRefreshCheckbox().set();
    performancePage.manualRefreshCheckbox().isChecked();
    performancePage.applyAndWait('manualRefresh-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":true');
    });

    // Disable manual refresh
    performancePage.manualRefreshCheckbox().isChecked();
    performancePage.manualRefreshCheckbox().set();
    performancePage.manualRefreshCheckbox().isUnchecked();
    performancePage.applyAndWait('manualRefresh-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":false');
    });
  });

  it('can toggle resource garbage collection', () => {
    PerformancePagePo.navTo();

    // Enable garbage collection
    performancePage.garbageCollectionCheckbox().isUnchecked();
    performancePage.garbageCollectionCheckbox().set();
    performancePage.garbageCollectionCheckbox().isChecked();
    // testing https://github.com/rancher/dashboard/issues/11856
    performancePage.garbageCollectionResourceCount().set('600');
    performancePage.applyAndWait('garbageCollection-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"countThreshold\":600');
    });

    // check elements value property
    performancePage.garbageCollectionResourceCount().shouldHaveValue('600');

    // Disable garbage collection
    performancePage.garbageCollectionCheckbox().isChecked();
    performancePage.garbageCollectionCheckbox().set();
    performancePage.garbageCollectionCheckbox().isUnchecked();
    performancePage.applyAndWait('garbageCollection-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":false');
    });
  });

  it('can toggle require namespace filtering', () => {
    PerformancePagePo.navTo();

    // Enable require namespace filtering
    performancePage.namespaceFilteringCheckbox().isUnchecked();
    performancePage.namespaceFilteringCheckbox().set();

    performancePage.incompatibleModal().getBody().contains('Required Namespace / Project Filtering is incompatible with Manual Refresh and Incremental Loading. Enabling this will disable them.');
    performancePage.incompatibleModal().submit('Continue');
    performancePage.namespaceFilteringCheckbox().isChecked();
    performancePage.applyAndWait('forceNsFilterV2-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":true');
    });

    // Disable require namespace filtering
    performancePage.namespaceFilteringCheckbox().isChecked();
    performancePage.namespaceFilteringCheckbox().set();
    performancePage.namespaceFilteringCheckbox().isUnchecked();
    performancePage.applyAndWait('forceNsFilterV2-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":false');
    });

    // Reenable incremental loading: this is disabled when we enable 'require namespace filtering'
    performancePage.incrementalLoadingCheckbox().isUnchecked();
    performancePage.incrementalLoadingCheckbox().set();
    performancePage.incrementalLoadingCheckbox().isChecked();
    performancePage.applyAndWait('incrementalLoading-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
    });
  });

  it('can toggle websocket web worker', () => {
    PerformancePagePo.navTo();

    // Enable websocket web worker
    performancePage.websocketWebWorkerCheckbox().isUnchecked();
    performancePage.websocketWebWorkerCheckbox().set();
    performancePage.websocketWebWorkerCheckbox().isChecked();
    performancePage.applyAndWait('advancedWorker-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":true');
    });

    // Disable websocket web worker
    performancePage.websocketWebWorkerCheckbox().isChecked();
    performancePage.websocketWebWorkerCheckbox().set();
    performancePage.websocketWebWorkerCheckbox().isUnchecked();
    performancePage.applyAndWait('advancedWorker-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":false');
    });
  });

  after('set default performance settings', () => {
    // get most updated version of settings info
    cy.getRancherResource('v1', 'management.cattle.io.settings', 'ui-performance', null).then((resp: Cypress.Response<any>) => {
      const response = resp.body.metadata;

      // update original data before sending request
      performanceSettingsOriginal[0].metadata.resourceVersion = response.resourceVersion;
      cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-performance', performanceSettingsOriginal[0]);
    });
  });
});
