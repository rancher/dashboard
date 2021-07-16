describe('Home Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Renders', () => {
    cy.visit('/home');
    cy.get('.title').contains('Welcome');
  });
});
