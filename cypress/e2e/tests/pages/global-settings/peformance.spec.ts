import { PerformancePagePo } from '@/cypress/e2e/po/pages/global-settings/performance.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Performance', { tags: '@adminUser' }, () => {
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

  context.only('Inactivity', () => {
    it('should show the modal after 6 seconds', () => {
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      performancePage.inactivityCheckbox().isUnchecked();

      // Enables the inactivity timeout and sets it to 6 seconds
      performancePage.inactivityCheckbox().set();
      performancePage.inactivityCheckbox().isChecked();
      performancePage.inactivityInput().clear().type('0.10');
      performancePage.applyButton().click();

      // We need to reload the page to get the new settings to take effect.
      cy.reload();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(6000); // We wait for the modal to show

      expect(performancePage.inactivityModalCard().getModal().should('exist'));

      expect(performancePage.inactivityModalCard().getCardTitle().should('exist'));
      expect(performancePage.inactivityModalCard().getCardBody().should('exist'));
      expect(performancePage.inactivityModalCard().getCardActions().should('exist'));

      expect(performancePage.inactivityModalCard().getCardTitle().should('contain', 'Session expired'));
      expect(performancePage.inactivityModalCard().getCardBody().should('contain', 'Your session has expired in this tab due to inactivity.'));
      expect(performancePage.inactivityModalCard().getCardBody().should('contain', 'To return to this page click “Refresh” below or refresh the browser.'));

      // // Clicking the refresh button should close the modal and restart the page
      // performancePage.inactivityModal().get("[data-testid='card-actions-slot']").contains('Refresh').click();
      expect(performancePage.inactivityModalCard().getCardActions().contains('Refresh').click());
      expect(performancePage.inactivityModalCard().getModal().should('be.not.visible'));
    });

    it('should reset the settings', () => {
      // INFO: We need to keep this in a separate test
      const performancePage = new PerformancePagePo();

      performancePage.goTo();

      performancePage.restoresSettings();

      // We need to reload the page to get the new settings to take effect.
      cy.reload();

      performancePage.inactivityCheckbox().isUnchecked();
    });
  });
});
