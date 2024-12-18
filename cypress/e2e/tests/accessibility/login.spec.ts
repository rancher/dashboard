import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Login page a11y testing', { tags: ['@adminUser', '@accessibility'] }, () => {
  it('wcag21aa test', () => {
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
    cy.checkElementAccessibility('#username', 'Username field checks');
  });
});
