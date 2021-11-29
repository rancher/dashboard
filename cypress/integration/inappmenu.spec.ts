import { DefaultNav } from './util/defaultnav';
import { TopLevelMenu } from '~/cypress/integration/util/toplevelmenu';
Cypress.config();
describe('Default Layout Side Nav', () => {
  const topLevelMenu = new TopLevelMenu();
  const defaultnav = new DefaultNav();

  beforeEach(() => {
    cy.login();
    cy.visit('/home');
    topLevelMenu.openIfClosed();
    topLevelMenu.clusters().eq(0).click();
  });

  it('navigates to menu item on click', () => {
    defaultnav.visibleNavTypes().eq(0).as('firstLink');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(600);
    cy.get('@firstLink').click();
    cy.get('@firstLink').then((linkEl) => {
      cy.location('href').should('equal', linkEl.prop('href'));
    });
  });

  it('opens menu groups on click', () => {
    defaultnav.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').click();
    cy.get('@closedGroup').find('ul').should('have.length.gt', 0);
    defaultnav.groups().get('expanded').should('not.be.instanceOf', Array);
  });

  it('closes menu groups on click', () => {
    defaultnav.groups().get('.expanded').as('openGroup');
    defaultnav.groups().not('.expanded').eq(0).click();
    cy.get('@openGroup').find('ul').should('have.length', 0);
  });

  it('navigates to a group item when group is expanded', () => {
    defaultnav.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').click();
    cy.get('@closedGroup').find('.nuxt-link-active').should('have.length.gt', 0);
  });

  it('contains only valid links', () => {
    // iterate through top-level groups
    defaultnav.groups().each((group, index) => {
      // expand current top-level group
      defaultnav.groups().eq(index).click();
      // check if it has sub-groups and expand them
      defaultnav.groups().eq(index).then((group) => {
        if (group.find('.accordion').length) {
          cy.wrap(group).get('.accordion .accordion').click({ multiple: true });
        }
      });
      // iterate through links
      defaultnav.visibleNavTypes().each((link, idx) => {
        // visit each link
        defaultnav.visibleNavTypes().eq(idx).click();
        // confirm the app has navigated to that location
        defaultnav.visibleNavTypes().eq(idx).then((linkEl) => {
          cy.location('href').should('equal', linkEl.prop('href'));
        });
      });
    });
  });
});
