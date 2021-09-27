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
  });

  it('closes menu groups on click', () => {
    defaultnav.groups().get('.expanded').as('openGroup');
    defaultnav.groups().not('.expanded').eq(0).click();
    cy.get('@openGroup').find('ul').should('have.length', 0);
  });

  it('navigates to group item when group is expanded', () => {
    defaultnav.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').click();
    cy.get('@closedGroup').find('.header.active').then((activeHeader) => {
      if (!activeHeader) {
        cy.get('@closedGroup').find('.nuxt-link-active').should('have.lenght.gt', 0);
      }
    });
  });

  it('contains only valid links', () => {
    defaultnav.groups().each((group, index) => {
      defaultnav.groups().eq(index).click();
      defaultnav.groups().eq(index).then((group) => {
        if (group.find('.accordion').length) {
          cy.wrap(group).get('.accordion .accordion').click({ multiple: true });
        }
      });
      defaultnav.visibleNavTypes().each((link, idx) => {
        defaultnav.visibleNavTypes().eq(idx).click();
        defaultnav.visibleNavTypes().eq(idx).then((linkEl) => {
          cy.location('href').should('equal', linkEl.prop('href'));
        });
      });
    });
  });
});
