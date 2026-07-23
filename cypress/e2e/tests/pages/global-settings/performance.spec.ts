import { PerformancePagePo } from '@/cypress/e2e/po/pages/global-settings/performance.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const performancePage = new PerformancePagePo();
const performanceSettingsOriginal: any[] = [];

describe('Performance', { testIsolation: 'off', tags: ['@globalSettings', '@adminUser'] }, () => {
  before('get default performance settings', () => {
    cy.login();
    HomePagePo.goTo();

    cy.getRancherResource('v1', 'management.cattle.io.settings', 'ui-performance').then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      performanceSettingsOriginal.push(body);
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
