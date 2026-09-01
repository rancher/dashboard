import HomePagePo from '@/cypress/e2e/po/pages/home.po';

describe('Page Actions', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
  });
});
