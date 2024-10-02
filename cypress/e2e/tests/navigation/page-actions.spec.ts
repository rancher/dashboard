import PageActions from '@/cypress/e2e/po/side-bars/page-actions.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

describe('Page Actions', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
  });

  it('Can restore hidden cards and displays welcome section', () => {
    const homePage = new HomePagePo();

    homePage
      .checkIsCurrentPage();
    const pageActionsPo = new PageActions();

    pageActionsPo.restoreLink().click();

    homePage
      .title()
      .should('eq', 'Welcome to Rancher');
  });
});
