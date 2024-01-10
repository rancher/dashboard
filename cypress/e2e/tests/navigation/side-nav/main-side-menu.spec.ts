import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

Cypress.config();
describe('Side Menu: main', () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    BurgerMenuPo.toggle();
  });
  it('Opens and closes on menu icon click', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    BurgerMenuPo.checkOpen();
    BurgerMenuPo.toggle();
    BurgerMenuPo.checkClosed();
  });

  it('Can display list of available clusters', { tags: ['@navigation', '@adminUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().should('exist');
  });

  it('Pinned and unpinned cluster', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.pinFirstCluster();
    burgerMenuPo.clusterPinnedList().should('exist');
    burgerMenuPo.unpinFirstCluster();
    burgerMenuPo.clusterPinnedList().should('not.exist');
  });

  it('Can display at least one menu category label', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.categories().should('have.length', 1);
  });

  it('Should show tooltip on mouse-hover when the menu is collapsed', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().first().trigger('mouseover');
    BurgerMenuPo.checkTooltipOff();
    BurgerMenuPo.toggle();
    BurgerMenuPo.checkTooltipOn();
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
  it.skip('Contains valid links', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();
    // Navigate through all the links

    burgerMenuPo.links().each((_, idx) => {
      // Cant bind to looped element due DOM changes while opening/closing side bar
      burgerMenuPo.links().eq(idx).should('be.visible').click({ force: true })
        .then((linkEl) => {
          cy.location('href').should('exist');
        });
    });
  });
});
