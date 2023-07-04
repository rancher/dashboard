import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

Cypress.config();
describe('Side navigation: Cluster ', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
    BurgerMenuPo.toggle();
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().eq(0).should('be.visible').click();
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger #5966
  it.skip('Can access to first navigation link on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.visibleNavTypes().eq(0).should('be.visible').click()
      .then((link) => {
        cy.url().should('equal', link.prop('href'));
      });
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
  it.skip('Can open second menu groups on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').should('be.visible').click();
    cy.get('@closedGroup').find('ul').should('have.length.gt', 0);
    productNavPo.groups().get('expanded').should('not.be.instanceOf', Array);
  });

  it('Can close first menu groups on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().get('.expanded').as('openGroup');
    productNavPo.groups().not('.expanded').eq(0).should('be.visible')
      .click();
    cy.get('@openGroup').find('ul').should('have.length', 0);
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
  it.skip('Should flag second menu group as active on navigation', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').should('be.visible').click();
    cy.get('@closedGroup').find('.nuxt-link-active').should('have.length.gt', 0);
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
  it.skip('Should access to every navigation provided from the server link, including nested cases, without errors', () => {
    const productNavPo = new ProductNavPo();
    // iterate through top-level groups

    productNavPo.groups().each((_, index) => {
      const group = productNavPo.groups().eq(index);

      // Select and expand current top-level group
      group.click();
      // check if it has sub-groups and expand them
      productNavPo.groups().eq(index).then((group) => {
        // FIXME: #5966: This may lead to flaky tests and should be replace after ensuring the navigation to be stable
        if (group.find('.accordion').length) {
          cy.wrap(group).get('.accordion .accordion').should('be.visible').click({ multiple: true });
        }
        // ensure group is expanded
        cy.wrap(group).find('ul').should('have.length.gt', 0);
      });

      // Visit each link and confirm the app has navigated to that location
      productNavPo.visibleNavTypes().each((link, idx) => {
        productNavPo.visibleNavTypes().eq(idx)
          .click({ force: true })
          .then((linkEl) => cy.url().should('equal', linkEl.prop('href')));
      });
    });
  });
});
