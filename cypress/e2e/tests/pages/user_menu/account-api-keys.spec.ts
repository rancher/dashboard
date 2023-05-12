import HomePagePo from '~/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import AccountPagePo from '~/cypress/e2e/po/pages/account-api-keys.po';
import CreateKeyPagePo from '~/cypress/e2e/po/pages/account-api-keys-create_key.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const userMenu = new UserMenuPo();
const accountPage = new AccountPagePo();
const createKeyPage = new CreateKeyPagePo();
const apiKeysList = accountPage.list();

describe('User can make changes to their account', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Can navigate to Account and API Keys page', () => {
    /*
    Open user menu and navigate to Account and API Keys page
    Verify url includes endpoint '/account'
    Verify page title
    */
    HomePagePo.goTo();
    userMenu.checkVisible();
    userMenu.toggle();
    userMenu.isOpen();
    userMenu.clickMenuItem('Account & API Keys');
    userMenu.isClosed();
    accountPage.waitForPage();
    accountPage.checkIsCurrentPage();
    accountPage.title();
  });

  it('Can change their password', () => {
    /**
     * Verify user can change their password and change it back
     */

    accountPage.goTo();

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
     * Verify user can create API key
     * Grab access key after creation and validate API key details
     * Verify user can delete API key
     */
    const keyDesc = `keyDescription${ Date.now() }`;

    accountPage.goTo();
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
      apiKeysList.details(accessKey[0], 2).should('include.text', accessKey[0]);
      apiKeysList.details(accessKey[0], 3).should('include.text', keyDesc);
      apiKeysList.actionMenu(accessKey[0]).getMenuItem('Delete').click();
    });
    const promptRemove = new PromptRemove();

    promptRemove.self().then(() => {
      cy.intercept('DELETE', `/v3/tokens/${ accessKey[0] }`).as('deleteApiKey');
      promptRemove.remove();
      cy.wait('@deleteApiKey').its('response.statusCode').should('eq', 204);
    });
  });
});
