import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

const userMenu = new UserMenuPo();
const loginPage = new LoginPagePo();

describe('User can logout of Rancher', { tags: ['@adminUser', '@standardUser', '@flaky'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('Can logout of Rancher successfully', () => {
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
});
