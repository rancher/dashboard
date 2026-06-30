import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { qase } from '@/cypress/support/qase';

describe('Home Page Settings', () => {
  const homePage = new HomePagePo();

  qase(3002, it('Confirm correct number of settings requests made', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    cy.login();

    cy.intercept('GET', '/v1/management.cattle.io.settings?exclude=metadata.managedFields').as('settingsReq');

    homePage.goTo();

    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response.body.count).greaterThan(PARTIAL_SETTING_THRESHOLD);
    });
    // Yes this is bad, but want to ensure no other settings requests are made.
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get('@settingsReq.all').should('have.length', 1);
  }));
});
