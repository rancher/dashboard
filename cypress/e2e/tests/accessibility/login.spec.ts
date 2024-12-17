import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Login page a11y testing', { tags: ['@adminUser', '@accessibility'] }, () => {
  const loginPage = new LoginPagePo();

  it('wcag21aa test', () => {
    loginPage.goTo();
    loginPage.waitForPage();

    cy.injectAxe();
    cy.checkPageAccessibility();
  });

  // it('locale selector', () => {
  //   loginPage.goTo();
  //   loginPage.waitForPage();

  //   cy.injectAxe();
  //   cy.get('[data-testid="locale-selector"]').click();
  //   cy.checkPageAccessibility();
  //   cy.checkElementAccessibility('#username', 'Username field checks');
  // });
});
