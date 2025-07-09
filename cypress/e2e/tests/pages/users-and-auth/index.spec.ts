import PagePo from '@/cypress/e2e/po/pages/page.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import UserRetentionPo from '@/cypress/e2e/po/pages/users-and-auth/user.retention.po';

function updateUserRetentionSetting(settingId, newValue) {
  cy.getRancherResource('v1', 'management.cattle.io.settings').then((data: any) => {
    const retentionSetting = data.body.data.find((setting) => setting.id === settingId);

    retentionSetting.value = newValue;

    cy.setRancherResource('v1', 'management.cattle.io.settings', settingId, retentionSetting);
  });
}

describe('Auth Index', { testIsolation: 'off' }, () => {
  const runTimestamp = +new Date();
  const usernameBlock = `user_to_block_${ runTimestamp }`;
  const userIdsList = [];

  before(() => {
    cy.login();
  });

  it('can redirect', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
    const page = new PagePo('/c/local/auth');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/auth/management.cattle.io.user`);
  });

  describe('User retention: admin user', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
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
      userRetentionPo.disableAfterPeriodInput().set('300h');
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

      // login as test user once to activate the retention
      cy.login(usernameBlock, Cypress.env('password'), false);
    });

    it('verify the user account has countdown timers', () => {
      const usersPo = new UsersPo();

      cy.logout();
      cy.login();

      usersPo.goTo();
      usersPo.waitForPage();

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

      // login as standard user
      cy.login();
      usersPo.goTo();
      usersPo.waitForPage();
      usersPo.userRetentionLink().checkNotExists();
    });
  });
});
