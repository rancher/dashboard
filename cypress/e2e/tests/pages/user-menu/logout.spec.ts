import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

const userMenu = new UserMenuPo();
const loginPage = new LoginPagePo();

describe('User can logout of Rancher', { tags: ['@userMenu', '@adminUser', '@standardUser', '@flaky'] }, () => {
  beforeEach(() => {
    // we need to forcefully not use the cached session for this test suite, otherwise
    // it get's into this weird state where it doesn't move past the login screen
    cy.login(Cypress.env('username'), Cypress.env('password'), false);
  });

  it('Can logout of Rancher successfully (normal/Rancher auth user)', () => {
    /*
    Logout of Rancher Dashboard
    Verify user lands on login page after logging out
    Attempt to navigate to the Home page without logging back in
    Verify user remains on login page
    */
    HomePagePo.goToAndWaitForGet();
    userMenu.clickMenuItem('Log Out');
    loginPage.waitForPage();
    loginPage.username().checkVisible();
    loginPage.loginPageMessage().contains('You have been logged out.').should('be.visible');
    HomePagePo.goTo();
    loginPage.loginPageMessage().contains('Log in again to continue.').should('be.visible');
    loginPage.waitForPage();
  });

  it('Can logout of Rancher successfully (SSO user)', () => {
    // The "principals" resource is what tells Rancher which auth provider is being used... (mocks Github auth)
    cy.intercept('GET', 'v3/principals', {
      type:         'collection',
      resourceType: 'principal',
      data:         [
        {
          baseType:       'principal',
          created:        null,
          creatorId:      null,
          id:             'github_user://97888974',
          links:          { self: 'https://my-rancher-address:8005/v3/principals/github_user:%2F%2F97888974' },
          loginName:      'some-user',
          me:             true,
          memberOf:       false,
          name:           'Some Dummy User',
          principalType:  'user',
          profilePicture: 'https://avatars.githubusercontent.com/u/97888974?v=4',
          provider:       'github',
          type:           'principal'
        }
      ]
    }).as('featuresGet');
    /*
    Logout of Rancher Dashboard using SSO method, which should display a different logout message
    */
    HomePagePo.goToAndWaitForGet();
    userMenu.clickMenuItem('Log Out');
    loginPage.waitForPage();
    loginPage.username().checkVisible();
    loginPage.loginPageMessage().contains("You've been logged out of Rancher, however you may still be logged in to your single sign-on identity provider.").should('be.visible');
  });
});
