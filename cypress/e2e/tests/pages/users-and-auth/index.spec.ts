import PagePo from '@/cypress/e2e/po/pages/page.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import UserRetentionPo from '@/cypress/e2e/po/pages/users-and-auth/user.retention.po';

describe('Auth Index', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can redirect', () => {
    const page = new PagePo('/c/local/auth');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/auth/management.cattle.io.user`);
  });

  it('can navigate to user retention settings', () => {
    const page = new PagePo('/c/local/auth');

    page.goTo();

    const usersPo = new UsersPo();

    usersPo.userRetentionLink().click();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/auth/user.retention`);
  });

  it('save button should be disabled when form is invalid', () => {
    const page = new PagePo('/c/local/auth/user.retention');

    page.goTo();

    const userRetentionPo = new UserRetentionPo();

    userRetentionPo.disableAfterPeriodCheckbox().set();
    userRetentionPo.disableAfterPeriodInput().set('30d');

    userRetentionPo.saveButton().expectToBeDisabled();
  });

  it('save button should be enabled when form is valid', () => {
    const page = new PagePo('/c/local/auth/user.retention');

    page.goTo();

    const userRetentionPo = new UserRetentionPo();

    userRetentionPo.disableAfterPeriodCheckbox().set();
    userRetentionPo.disableAfterPeriodInput().set('30d');
    userRetentionPo.userRetentionCron().set('0 0 1 1 *');

    userRetentionPo.saveButton().expectToBeEnabled();
  });

  it('can save user retention settings', () => {
    const page = new PagePo('/c/local/auth/user.retention');

    page.goTo();

    const userRetentionPo = new UserRetentionPo();

    userRetentionPo.disableAfterPeriodCheckbox().set();
    userRetentionPo.disableAfterPeriodInput().set('300h');
    userRetentionPo.deleteAfterPeriodCheckbox().set();
    userRetentionPo.deleteAfterPeriodInput().set('600h');
    userRetentionPo.userRetentionCron().set('0 0 1 1 *');
    // userRetentionPo.userRetentionDryRun().set('true');
    userRetentionPo.userLastLoginDefault().set('1718744536000');

    userRetentionPo.saveButton().expectToBeEnabled();
    userRetentionPo.saveButton().click();

    cy.url().should('include', '/management.cattle.io.user');

    const usersPo = new UsersPo();

    usersPo.userRetentionLink().checkVisible();
    usersPo.userRetentionLink().click();

    userRetentionPo.disableAfterPeriodCheckbox().checkExists();
    userRetentionPo.disableAfterPeriodCheckbox().isChecked();
    userRetentionPo.disableAfterPeriodInput().value().should('equal', '300h');
    userRetentionPo.deleteAfterPeriodCheckbox().isChecked();
    userRetentionPo.deleteAfterPeriodInput().value().should('equal', '600h');
    userRetentionPo.userRetentionCron().value().should('equal', '0 0 1 1 *');
    userRetentionPo.userLastLoginDefault().value().should('equal', '1718744536000');
  });
});
