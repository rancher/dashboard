import { TopLevelMenu } from '~/cypress/integration/util/toplevelmenu';

describe('Home Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/home');
  });

  it('Renders', () => {
    cy.get('.title').contains('Welcome');
  });

  it('Has a top-level nav menu', () => {
    const topLevelMenu = new TopLevelMenu();

    topLevelMenu.toggle();
  });
});
