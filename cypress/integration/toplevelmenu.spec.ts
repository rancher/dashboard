import { TopLevelMenu } from '~/cypress/integration/util/toplevelmenu';

describe('Cluster Dashboard', () => {
  beforeEach(() => {
    cy.login();
  });

  const topLevelMenu = new TopLevelMenu();

  it('Opens and closes on menu icon click', () => {
    topLevelMenu.toggle();
    cy.get('.side-menu-glass').should('exist');
    topLevelMenu.toggle();
    cy.get('.side-menu-glass').should('not.exist');
  });

  it('Has clusters', () => {
    topLevelMenu.toggle();

    topLevelMenu.clusters().should('exist');
  });

  it('Has a localization link', () => {
    topLevelMenu.toggle();

    topLevelMenu.localization().should('exist');
  });

  it('Has at least one menu category', () => {
    topLevelMenu.toggle();
    topLevelMenu.categories().should('have.length.greaterThan', 0);
  });
});
