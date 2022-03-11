import HomePagePo from '@/cypress/integration/po/pages/home.po';
import BurgerMenuPo from '@/cypress/integration/po/side-bars/burger-side-menu.po';

describe('Home Page', () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
  });

  it('Renders', () => {
    const homePage = new HomePagePo();

    homePage
      .checkIsCurrentPage();

    homePage
      .title()
      .should('eq', 'Welcome to Rancher');
  });

  it('Has a top-level nav menu', () => {
    BurgerMenuPo.toggle();

    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.checkVisible();
  });
});
