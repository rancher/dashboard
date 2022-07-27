import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import PageActions from '@/cypress/e2e/po/side-bars/page-actions.po';

describe('Home Page', () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
  });

  it('Has a top-level nav menu', () => {
    BurgerMenuPo.toggle();

    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.checkVisible();
  });

  it.skip('Displays changelog section', () => {
    const homePage = new HomePagePo();
    const pageActionsPo = new PageActions();

    PageActions.open();
    pageActionsPo.restoreLink().click();
    homePage
      .checkIsCurrentPage();

    // This element is hidden after navigating to the page
    homePage
      .changelog()
      .should('contain', `What's new in`);
  });
});
