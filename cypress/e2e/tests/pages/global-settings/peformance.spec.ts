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

  it('Can navigate to Performance Page', () => {
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
    it('should be disabled by default', () => {
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      performancePage.inactivityCheckbox().isUnchecked();
    });

    it('should show the modal after 6 seconds', () => {
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      // Enables the inactivity timeout and sets it to 6 seconds
      performancePage.inactivityCheckbox().set();
      performancePage.inactivityCheckbox().isChecked();
      performancePage.inactivityInput().clear().type('0.10');
      performancePage.applyButton().click();

      // We need to reload the page to get the new settings to take effect.
      cy.reload();

      // INFO: The idea here is to set the clock to a future time and then tick it forward to trigger the modal, but it doesn't work and I'm not sure why.
      // const currentTime = new Date();
      // const futureTime = new Date(currentTime.getTime() + 6000); // Add 60,000 milliseconds (1 minute)

      // cy.clock(futureTime); // Sets the clock to the future time
      // cy.tick(6000); // Tick the clock forward by 1 minute

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(6000); // We wait for the modal to show

      expect(performancePage.inactivityModal().should('exist'));
      expect(performancePage.inactivityModal().should('be.visible'));
      expect(performancePage.inactivityModal().get("[data-testid='card-title-slot']").should('exist'));
      expect(performancePage.inactivityModal().get("[data-testid='card-title-slot']").should('be.visible'));
      expect(performancePage.inactivityModal().get("[data-testid='card-title-slot']").should('contain', 'Session expired'));
      expect(performancePage.inactivityModal().get("[data-testid='card-body-slot']").should('contain', ' Your session has expired in this tab due to inactivity'));

      // Clicking the refresh button should close the modal and restart the page
      performancePage.inactivityModal().get("[data-testid='card-actions-slot']").contains('Refresh').click();
      expect(performancePage.inactivityModal().should('be.not.visible'));
    });

    it('should reset the settings', () => {
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      performancePage.restoresSettings();

      cy.reload();

      performancePage.inactivityCheckbox().isUnchecked();
    });
  });
});
