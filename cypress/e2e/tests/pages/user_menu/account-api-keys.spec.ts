import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const userMenu = new UserMenuPo();
const accountPage = new AccountPagePo();
const createKeyPage = new CreateKeyPagePo();
const apiKeysList = accountPage.list();

describe('User can make changes to their account', { tags: ['@adminUser', '@standardUser', '@flaky'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('Can navigate to Account and API Keys page and change their password', () => {
    /**
     * Open user menu and navigate to Account and API Keys page
     * Verify url includes endpoint '/account'
     * Verify page title
     * Verify user can change their password and change it back
     */

    HomePagePo.goToAndWaitForGet();
    userMenu.clickMenuItem('Account & API Keys');
    accountPage.waitForPage();
    accountPage.checkIsCurrentPage();
    accountPage.title();

    accountPage.changePassword();
    accountPage.currentPassword().set(Cypress.env('password'));
    accountPage.newPassword().set('NewPassword11!!');
    accountPage.confirmPassword().set('NewPassword11!!');
    cy.intercept('POST', '/v3/users?action=changepassword').as('changePw');
    accountPage.apply();
    cy.wait('@changePw').its('response.statusCode').should('eq', 200);

    accountPage.changePassword();
    accountPage.currentPassword().set('NewPassword11!!');
    accountPage.newPassword().set(Cypress.env('password'));
    accountPage.confirmPassword().set(Cypress.env('password'));
    accountPage.apply();
    cy.wait('@changePw').its('response.statusCode').should('eq', 200);
  });

  it('Can create and delete API keys', () => {
    /**
     * Bulk delete existing API keys (to make this a deterministic test)
     * Verify empty state message displays
     * Verify user can create API key and verify number of rows on table is 1
     * Grab access key after creation and validate API key details
     * Verify user can delete API key and verify empty state message displays
     */
    const keyDesc = `keyDescription${ Date.now() }`;

    accountPage.goTo();
    accountPage.create();
    createKeyPage.waitForPage();
    createKeyPage.isCurrentPage();
    createKeyPage.create();
    createKeyPage.done();

    apiKeysList.resourceTable().sortableTable().selectAllCheckbox().set();
    apiKeysList.resourceTable().sortableTable().deleteButton().click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    apiKeysList.resourceTable().sortableTable().checkRowCount(true, 1);

    accountPage.create();
    createKeyPage.waitForPage();
    createKeyPage.isCurrentPage();
    createKeyPage.title();
    createKeyPage.description().set(keyDesc);
    createKeyPage.create();

    const accessKey: string[] = [];

    createKeyPage.apiAccessKey().invoke('text').then((el) => {
      accessKey.push(el);

      createKeyPage.done();
      apiKeysList.checkVisible();
      apiKeysList.resourceTable().sortableTable().checkRowCount(false, 1);
      apiKeysList.details(accessKey[0], 2).should('include.text', accessKey[0]);
      apiKeysList.details(accessKey[0], 3).should('include.text', keyDesc);
      apiKeysList.actionMenu(accessKey[0]).getMenuItem('Delete').click();
    });

    cy.intercept('DELETE', '/v3/tokens/*').as('deleteApiKey');
    promptRemove.remove();
    cy.wait('@deleteApiKey').its('response.statusCode').should('eq', 204);

    apiKeysList.resourceTable().sortableTable().checkRowCount(true, 1);
  });
});
