import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Theme of loading indicator', () => {
  afterEach(() => {
    LoginPagePo.goTo();
  });

  it('Should align with dashboard theme', () => {
    cy.setCookie('R_THEME', 'dark');
    cy.visit(`${ Cypress.config().baseUrl }/public/index.html`);
    
    cy.get('head style').should('contain', '--loading-bg-color: #1b1c21');
  });
});
