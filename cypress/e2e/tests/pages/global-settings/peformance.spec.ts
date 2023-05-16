import { PerformancePagePo } from '~/cypress/e2e/po/pages/global-settings/performance.po';
import { SettingsPagePo } from '~/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '~/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '~/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '~/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Performance', () => {
  // If we need to speed tests up these should be combined into a single `it` (so only one page load and one refresh is used)
  beforeEach(() => {
    cy.login();
  });

  it.skip('Can navigate to Performance Page', () => {
    HomePagePo.goTo();

    const burgerMenu = new BurgerMenuPo();
    const productMenu = new ProductNavPo();

    BurgerMenuPo.toggle();

    burgerMenu.categories().contains(` Configuration `).should('exist');
    const globalSettingsNavItem = burgerMenu.links().contains(`Global Settings`);

    globalSettingsNavItem.should('exist');
    globalSettingsNavItem.click();
    const settingsPage = new SettingsPagePo();

    settingsPage.waitForPageWithClusterId();

    const performancePageNavItem = productMenu.visibleNavTypes().contains('Performance');

    performancePageNavItem.should('exist');
    performancePageNavItem.click();

    const performancePage = new PerformancePagePo();

    performancePage.waitForPageWithClusterId();
  });

  context('Inactivity', () => {
    it('disabled by default', () => {
      cy.clock(); // Starts the clock
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      performancePage.inactivityCheckbox().isDisabled();
      performancePage.inactivityCheckbox().set();
      performancePage.inactivityCheckbox().isChecked();
      performancePage.applyButton().click();

      // Continue with your assertions and further test steps

      // performancePage.inactivityCheckbox().isChecked();
      // performancePage.inactivityCheckbox().set();
      // performancePage.applyButton().click();
    });

    it.only('should show the modal', () => {
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      // performancePage.inactivityCheckbox().isDisabled();
      // performancePage.inactivityCheckbox().set();
      performancePage.inactivityCheckbox().isChecked();
      // performancePage.applyButton().click();

      // cy.reload();

      // Advance time by 1 minute
      const currentTime = new Date();
      const futureTime = new Date(currentTime.getTime() + 50000); // Add 60,000 milliseconds (1 minute)

      cy.clock(futureTime); // Sets the clock to the future time

      // Perform your test actions that should trigger the banner

      cy.tick(50000); // Tick the clock forward by 1 minute

      expect(performancePage.inactivityModal().should('exist'));
      expect(performancePage.inactivityModal().should('be.visible'));
      // expect(performancePage.inactivityModal().get("[data-testid='card-title-slot']").should('exist'));

      // expect(performancePage.inactivityModal().should('exist'));

      // Continue with your assertions and further test steps

      // performancePage.inactivityCheckbox().isChecked();
      // performancePage.inactivityCheckbox().set();
      // performancePage.applyButton().click();
    });
  });

  // it('Inactivity Label', () => {
  //   const performancePage = new PerformancePagePo();

  //   performancePage.goTo();

  //   performancePage.inactivityCheckbox().set();

  //   performancePage.applyButton().click();
  //   cy.intercept('PUT', 'v1/management.cattle.io.settings/ui-performance').as('perfUpdate');

  //   cy.wait('@perfUpdate').then(({ request, response }) => {
  //     console.log('🚀 ~ file: peformance.spec.ts:52 ~ cy.wait ~ response:', response);
  //     expect(response?.statusCode).to.eq(200);
  //     // expect(request.body.metadata).to.have.property('fields', 'true');
  //   });
  // });

  // it('Inactivity show modal ', () => {
  //   const performancePage = new PerformancePagePo();

  //   performancePage.goTo();

  //   performancePage.inactivityCheckbox().set();

  //   performancePage.applyButton().click();
  //   cy.reload();
  // });
});
