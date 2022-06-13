import { LoginPagePo } from '@/cypress/integration/po/pages/login-page.po';

/**
 * Login local authentication, including first login and bootstrap if not cached
 */
Cypress.Commands.add('login', (
  username = Cypress.env('username'),
  password = Cypress.env('password'),
  cacheSession = true,
) => {
  const login = () => {
    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    LoginPagePo.goTo(); // Needs to happen before the page element is created/located
    const loginPage = new LoginPagePo();

    loginPage
      .checkIsCurrentPage();

    loginPage.switchToLocal();

    loginPage.canSubmit()
      .should('eq', true);

    loginPage.username()
      .set(username);

    loginPage.password()
      .set(password);

    loginPage.canSubmit()
      .should('eq', true);
    loginPage.submit();

    cy.wait('@loginReq');
  };

  if (cacheSession) {
    (cy as any).session([username, password], login);
  } else {
    login();
  }
});

/**
 * Get input field for given label
 */
Cypress.Commands.add('byLabel', (label) => {
  return cy.get('.labeled-input').contains(label).siblings('input');
});

/**
 * Wrap the cy.get() command to simplify the selector declaration of the data-testid
 */
Cypress.Commands.add('getId', (id: string) => {
  return cy.get(`[data-testid="${ id }"]`);
});
