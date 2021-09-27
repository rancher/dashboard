// describe('Local authentication', () => {
//   it('Log in with valid creds', () => {
//     cy.visit('/auth/login');
//     cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

//     cy.login(Cypress.env('username'), Cypress.env('password'));

//     cy.wait('@loginReq').then((login) => {
//       expect(login.response?.statusCode).to.equal(200);
//       cy.url().should('not.equal', `${ Cypress.config().baseUrl }/auth/login`);
//     });
//   });

//   it('Cannot login with invalid creds', () => {
//     cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

//     cy.login(Cypress.env('username'), `${ Cypress.env('password') }abc`);

//     cy.wait('@loginReq').then((login) => {
//       expect(login.response?.statusCode).to.not.equal(200);
//       cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/login`);
//     });
//   });
// });
