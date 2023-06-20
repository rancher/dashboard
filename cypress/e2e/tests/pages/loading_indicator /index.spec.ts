import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Theme of loading indicator', () => {
  afterEach(() => {
    LoginPagePo.goTo();
  });

  it('should have dark color', () => {
    cy.setCookie('R_THEME', 'dark');
    cy.visit(`${ Cypress.config().baseUrl }/public/index.html`);
    
    cy.get('head style').should('contain', '--loading-bg-color: #1b1c21');
  });
  it('should have light color', () => {
    cy.setCookie('R_THEME', 'light');
    cy.visit(`${ Cypress.config().baseUrl }/public/index.html`);
    
    cy.get('head style').should('contain', '--loading-bg-color: #FFF');
  });
});
