import HomePagePo from '@/cypress/integration/po/pages/home.po';
import BurgerMenuPo from '@/cypress/integration/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/integration/po/side-bars/product-side-nav.po';

Cypress.config();
describe('Cluster Side Nav ', () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
    BurgerMenuPo.openIfClosed();
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().eq(0).click();
  });

  it('navigates to menu item on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.visibleNavTypes().eq(0).as('firstLink');
    cy.get('@firstLink').click();
    cy.get('@firstLink').then((linkEl) => {
      cy.location('href').should('equal', linkEl.prop('href'));
    });
  });

  it('opens menu groups on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').click();
    cy.get('@closedGroup').find('ul').should('have.length.gt', 0);
    productNavPo.groups().get('expanded').should('not.be.instanceOf', Array);
  });

  it('closes menu groups on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().get('.expanded').as('openGroup');
    productNavPo.groups().not('.expanded').eq(0).click();
    cy.get('@openGroup').find('ul').should('have.length', 0);
  });

  it('navigates to a group item when group is expanded', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').click();
    cy.get('@closedGroup').find('.nuxt-link-active').should('have.length.gt', 0);
  });

  it('contains only valid links', () => {
    // iterate through top-level groups
    const productNavPo = new ProductNavPo();

    productNavPo.groups().each((group, index) => {
      // expand current top-level group
      productNavPo.groups().eq(index).click();
      // check if it has sub-groups and expand them
      productNavPo.groups().eq(index).then((group) => {
        if (group.find('.accordion').length) {
          cy.wrap(group).get('.accordion .accordion').click({ multiple: true });
        }
        // ensure group is expanded
        cy.wrap(group).find('ul').should('have.length.gt', 0);
      });
      // iterate through links
      productNavPo.visibleNavTypes().each((link, idx) => {
        // visit each link
        productNavPo.visibleNavTypes().eq(idx).click();
        // confirm the app has navigated to that location
        productNavPo.visibleNavTypes().eq(idx).then((linkEl) => {
          cy.location('href').should('equal', linkEl.prop('href'));
        });
      });
    });
  });
});
