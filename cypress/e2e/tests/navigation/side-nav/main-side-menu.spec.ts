import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

Cypress.config();
describe('Side Menu: main', () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    BurgerMenuPo.toggle();
  });

  it('Opens and closes on menu icon click', () => {
    BurgerMenuPo.checkOpen();
    BurgerMenuPo.toggle();
    BurgerMenuPo.checkClosed();
  });

  it('Can display list of available clusters', () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().should('exist');
  });

  it('Can display at least one menu category label', () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.categories().should('have.length.greaterThan', 0);
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
  it.skip('Contains valid links', () => {
    const burgerMenuPo = new BurgerMenuPo();

    // Navigate through all the links
    burgerMenuPo.links().each((_, idx) => {
      BurgerMenuPo.toggle();
      // Cant bind to looped element due DOM changes while opening/closing side bar
      burgerMenuPo.links().eq(idx).should('be.visible').click({ force: true })
        .then((linkEl) => {
          cy.location('href').should('include', linkEl.prop('href'));
          // Always open menu after navigation, to make visible other links
          BurgerMenuPo.toggle();
        });
    });
  });
});
