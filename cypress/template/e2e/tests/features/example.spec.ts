// Example of Page Object from @rancher/cypress
import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';

describe('Example Test', () => {
  const homePage = new HomePagePo();

  it('should work', () => {
    cy.customCommand();

    homePage.checkExists();

    // Example of using a @rancher/cypress command
    cy.login();

    homePage.goTo();
  });
});
