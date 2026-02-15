import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import UserRetentionPo from '@/cypress/e2e/po/pages/users-and-auth/user.retention.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { MEDIUM_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

function updateUserRetentionSetting(settingId, newValue) {
  cy.getRancherResource('v1', 'management.cattle.io.settings').then((data: any) => {
    const retentionSetting = data.body.data.find((setting) => setting.id === settingId);

    retentionSetting.value = newValue;

    cy.setRancherResource('v1', 'management.cattle.io.settings', settingId, retentionSetting);
  });
}

describe('User Retention', { testIsolation: 'off' }, () => {
  const runTimestamp = +new Date();
  const usernameBlock = `user_to_block_${ runTimestamp }`;
  const userIdsList = [];
  const userRetentionPo = new UserRetentionPo();

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('getUsers');
    cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*').as('pageLoad');
  });

  describe('User retention: admin user', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
    it('save button should be disabled when form is invalid', () => {
      UserRetentionPo.navTo();
      userRetentionPo.waitForPage();
      cy.wait('@pageLoad');
      userRetentionPo.disableAfterPeriodCheckbox().set();
      userRetentionPo.disableAfterPeriodInput().set('30d');

      userRetentionPo.saveButton().expectToBeDisabled();
    });

    it('save button should be enabled when form is valid', () => {
      UserRetentionPo.navTo();
      userRetentionPo.waitForPage();
      cy.wait('@pageLoad');
      userRetentionPo.disableAfterPeriodCheckbox().set();
      userRetentionPo.disableAfterPeriodInput().set('300h');
      userRetentionPo.userRetentionCron().set('0 0 1 1 *');

      userRetentionPo.saveButton().expectToBeEnabled();
    });

    it('can save user retention settings', () => {
      UserRetentionPo.navTo();
      userRetentionPo.waitForPage();
      cy.wait('@pageLoad');

      userRetentionPo.disableAfterPeriodInput().expectToBeDisabled();
      userRetentionPo.disableAfterPeriodCheckbox().set();
      userRetentionPo.disableAfterPeriodInput().expectToBeEnabled();
      userRetentionPo.disableAfterPeriodInput().set('300h');
      userRetentionPo.deleteAfterPeriodInput().expectToBeDisabled();
      userRetentionPo.deleteAfterPeriodCheckbox().set();
      userRetentionPo.deleteAfterPeriodInput().expectToBeEnabled();
      userRetentionPo.deleteAfterPeriodInput().set('600h');
      userRetentionPo.userRetentionCron().set('0 0 1 1 *');
      userRetentionPo.userLastLoginDefault().set('1718744536000');

      userRetentionPo.saveButton().expectToBeEnabled();

      cy.intercept('PUT', '/v1/management.cattle.io.settings/*').as('saveUserRetention');
      userRetentionPo.saveButton().click();

      // Wait for the first request to complete successfully
      cy.wait('@saveUserRetention').its('response.statusCode').should('eq', 200);

      // Wait for all 5 requests to complete, with proper timeout
      cy.get('@saveUserRetention.all', MEDIUM_TIMEOUT_OPT).should('have.length', 5);

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

    it('setup a user account that will be blocked', () => {
      const usersPo = new UsersPo();

      cy.createUser({
        username:    usernameBlock,
        globalRole:  { role: 'user' },
        projectRole: {
          clusterId:   'local',
          projectName: 'Default',
          role:        'project-member',
        }
      }).then((resp: Cypress.Response<any>) => {
        const userId = resp.body.id;

        userIdsList.push(userId);
      });

      // Initialize the retention settings in case they are not.

      updateUserRetentionSetting('disable-inactive-user-after', '50h');

      updateUserRetentionSetting('user-retention-cron', '* * * * *');

      updateUserRetentionSetting('delete-inactive-user-after', '500h');

      usersPo.goTo();
      usersPo.waitForPage();
      cy.wait('@getUsers');

      // login as test user once to activate the retention
      cy.login(usernameBlock, Cypress.env('password'), false);
    });

    it('verify the user account has countdown timers', () => {
      const usersPo = new UsersPo();

      // Disable session management and force complete logout
      Cypress.session.clearAllSavedSessions();
      cy.logout();

      // Clear all possible session storage
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });
      cy.login();
      usersPo.goTo();
      usersPo.waitForPage();
      cy.wait('@getUsers');

      // Disable After
      usersPo.list().resourceTable().sortableTable().rowWithPartialName(usernameBlock)
        .column(7)
        .should('not.eq', '-');

      // Delete After
      usersPo.list().resourceTable().sortableTable().rowWithPartialName(usernameBlock)
        .column(8)
        .should('not.eq', '-');
    });

    after(() => {
      // reset user retention settings
      updateUserRetentionSetting('disable-inactive-user-after', null);

      updateUserRetentionSetting('user-retention-cron', null);

      updateUserRetentionSetting('delete-inactive-user-after', null);

      // delete users
      userIdsList.forEach((r) => cy.deleteRancherResource('v3', 'Users', r, false));
    });
  });

  describe('User retention: standard user', { tags: ['@usersAndAuths', '@standardUser'] }, () => {
    it('standard user should not have access to user retention page', () => {
      const usersPo = new UsersPo();

      // Disable session management and force complete logout
      Cypress.session.clearAllSavedSessions();
      cy.logout();

      // Clear all possible session storage
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      // Now login fresh
      cy.login();
      usersPo.goTo();
      usersPo.waitForPage();
      cy.wait('@getUsers');
      usersPo.userRetentionLink().checkNotExists();
    });
  });
});
