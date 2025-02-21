import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';

describe('Shell a11y testing', { tags: ['@adminUser', '@accessibility'] }, () => {
  it('login page', () => {
    const loginPage = new LoginPagePo();

    loginPage.goTo();
    loginPage.waitForPage();
    cy.injectAxe();
    loginPage.username().set('test user');

    cy.checkPageAccessibility();
  });

  it('locale selector', () => {
    const loginPage = new LoginPagePo();

    loginPage.goTo();
    loginPage.waitForPage();
    cy.injectAxe();
    cy.get('[data-testid="locale-selector"]').click();
    cy.checkPageAccessibility();
  });

  describe('Logged in', { testIsolation: 'off' }, () => {
    const aboutPage = new AboutPagePo();
    const prefPage = new PreferencesPagePo();
    const userMenu = new UserMenuPo();

    before(() => {
      cy.login();
    });

    it('home page', () => {
      HomePagePo.goToAndWaitForGet();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    it('about page', () => {
      AboutPagePo.navTo();
      aboutPage.waitForPage();

      cy.checkPageAccessibility();
    });

    it('preferences page', () => {
      userMenu.clickMenuItem('Preferences');
      userMenu.isClosed();
      prefPage.waitForPage();
      prefPage.checkIsCurrentPage();
      prefPage.title();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    describe('account', () => {
      const accountPage = new AccountPagePo();
      const createKeyPage = new CreateKeyPagePo();

      it('account page', () => {
        userMenu.clickMenuItem('Account & API Keys');
        accountPage.waitForPage();
        cy.injectAxe();
        accountPage.checkIsCurrentPage();

        cy.checkPageAccessibility();
      });

      it('change password dialog', () => {
        accountPage.changePassword();

        cy.checkElementAccessibility('.change-password-modal');

        accountPage.cancel();
      });

      it('create API key', () => {
        accountPage.create();
        createKeyPage.waitForPage();
        createKeyPage.isCurrentPage();

        cy.checkPageAccessibility();
      });
    });
  });
});
