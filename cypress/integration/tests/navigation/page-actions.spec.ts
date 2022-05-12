import PageActions from '@/cypress/integration/po/side-bars/page-actions.po';
import HomePagePo from '@/cypress/integration/po/pages/home.po';

describe('Page Actions', () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
  });

  it('Can restore hidden cards and displays welcome section', () => {
    const homePage = new HomePagePo();

    homePage
      .checkIsCurrentPage();
    PageActions.open();
    const pageActionsPo = new PageActions();

    pageActionsPo.restoreLink().click();

    homePage
      .title()
      .should('eq', 'Welcome to Rancher');
  });
});
