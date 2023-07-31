import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Login page a11y testing', { tags: ['@adminUser', '@standardUser'] }, () => {
  it('wcag21aa test', (wait = 600) => {
    LoginPagePo.goTo();
    cy.injectAxe();
    cy.wait(wait);
    cy.checkPageAccessibility();
  });
});
