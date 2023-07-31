import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Local authentication', { tags: ['@adminUser', '@standardUser'] }, () => {
  it('Log in with valid credentials', () => {
    LoginPagePo.goTo();
    cy.injectAxe();
    cy.wait(600);
    cy.checkPageAccessibility();
  });
});
