import HomePagePo from '@/cypress/integration/po/pages/home.po';
import BurgerMenuPo from '@/cypress/integration/po/side-bars/burger-side-menu.po';

Cypress.config();
describe('Burger Side Menu', () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    BurgerMenuPo.openIfClosed();
  });

  it('Opens and closes on menu icon click', () => {
    BurgerMenuPo.checkOpen();
    BurgerMenuPo.toggle();
    BurgerMenuPo.checkClosed();
  });

  it('Has clusters', () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().should('exist');
  });

  it('Has a localization link', () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.localization().should('exist');
  });

  it('Has at least one menu category', () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.categories().should('have.length.greaterThan', 0);
  });

  it('Contains valid links', () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.links().each((link, idx) => {
      BurgerMenuPo.openIfClosed();
      const linkElement = burgerMenuPo.links().eq(idx);

      return linkElement.then((linkEl) => {
        linkElement.click();

        return cy.location('href').then((url) => {
          if (url.includes('explorer')) {
            cy.intercept(/.+\/v1\/nodes$/).as('nodeRequest');
            cy.wait(['@nodeRequest']);
          }
          cy.location('href').should('include', linkEl.prop('href'));
        });
      });
    });
  });
});
