import { TopLevelMenu } from '~/cypress/integration/util/toplevelmenu';

Cypress.config();
describe('TopLevelMenu', () => {
  const topLevelMenu = new TopLevelMenu();

  beforeEach(() => {
    cy.login();
    cy.visit('/home');
    topLevelMenu.openIfClosed();
  });

  it('Opens and closes on menu icon click', () => {
    cy.get('.side-menu-glass').should('exist');
    topLevelMenu.toggle();
    cy.get('.side-menu-glass').should('not.exist');
  });

  it('Has clusters', () => {
    topLevelMenu.clusters().should('exist');
  });

  it('Has a localization link', () => {
    topLevelMenu.localization().should('exist');
  });

  it('Has at least one menu category', () => {
    topLevelMenu.categories().should('have.length.greaterThan', 0);
  });

  it('Contains valid links', () => {
    topLevelMenu.links().each((link, idx) => {
      topLevelMenu.openIfClosed();
      topLevelMenu.links().eq(idx).click();

      return topLevelMenu.links().eq(idx).then((linkEl) => {
        return cy.location('href').then((url) => {
          if (url.includes('explorer')) {
            cy.intercept(/.+\/v1\/nodes$/).as('nodeRequest');
            cy.wait(['@nodeRequest']);
          }
          // topLevelMenu.openIfClosed();
          cy.location('href').should('include', linkEl.prop('href'));
        });
      });
    });
  });
});
