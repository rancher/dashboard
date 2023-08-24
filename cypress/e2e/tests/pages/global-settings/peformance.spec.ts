import { PerformancePagePo } from '@/cypress/e2e/po/pages/global-settings/performance.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import CardPo from '@/cypress/e2e/po/components/card.po';

const performancePage = new PerformancePagePo();

describe('Performance', { tags: ['@globalSettings', '@adminUser'] }, () => {
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
    performancePage.waitForPageWithClusterId();
  });

  describe('Inactivity', () => {
    it('should show the modal after 6 seconds', () => {
      performancePage.goTo();

      performancePage.inactivityCheckbox().isUnchecked();

      // Enables the inactivity timeout and sets it to 6 seconds
      performancePage.inactivityCheckbox().set();
      performancePage.inactivityCheckbox().isChecked();
      performancePage.inactivityInput().clear().type('0.10');
      performancePage.applyAndWait();

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

      performancePage.restoresInactivitySettings();

      // We need to reload the page to get the new settings to take effect.
      cy.reload();

      performancePage.inactivityCheckbox().isUnchecked();
    });
  });

  it('can toggle websocket notifications', () => {
    performancePage.goTo();

    // Enable websocket notifications
    performancePage.websocketCheckbox().isChecked();
    performancePage.websocketCheckbox().set();
    performancePage.websocketCheckbox().isUnchecked();
    performancePage.applyAndWait('disableWebsocketNotification-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"disableWebsocketNotification\":false');
      expect(response?.body).to.have.property('value').contains('\"disableWebsocketNotification\":false');
    });

    // Disable websocket notifications
    performancePage.websocketCheckbox().isUnchecked();
    performancePage.websocketCheckbox().set();
    performancePage.websocketCheckbox().isChecked();
    performancePage.applyAndWait('disableWebsocketNotification-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"disableWebsocketNotification\":true');
      expect(response?.body).to.have.property('value').contains('\"disableWebsocketNotification\":true');
    });
  });

  it('can toggle incremental loading', () => {
    performancePage.goTo();

    // Disable incremental loading
    performancePage.incrementalLoadingCheckbox().isChecked();
    performancePage.incrementalLoadingCheckbox().set();
    performancePage.incrementalLoadingCheckbox().isUnchecked();
    performancePage.applyAndWait('incrementalLoading-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":false');
    });

    // Enable incremental loading
    performancePage.incrementalLoadingCheckbox().isUnchecked();
    performancePage.incrementalLoadingCheckbox().set();
    performancePage.incrementalLoadingCheckbox().isChecked();
    performancePage.applyAndWait('incrementalLoading-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
    });
  });

  it('can toggle manual refresh', () => {
    performancePage.goTo();

    // Enable manual refresh
    performancePage.manualRefreshCheckbox().isUnchecked();
    performancePage.manualRefreshCheckbox().set();
    performancePage.manualRefreshCheckbox().isChecked();
    performancePage.applyAndWait('manualRefresh-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":true');
    });

    // Disable manual refresh
    performancePage.manualRefreshCheckbox().isChecked();
    performancePage.manualRefreshCheckbox().set();
    performancePage.manualRefreshCheckbox().isUnchecked();
    performancePage.applyAndWait('manualRefresh-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"manualRefresh\":{\"enabled\":false');
    });
  });

  it('can toggle resource garbage collection', () => {
    performancePage.goTo();

    // Enable garbage collection
    performancePage.garbageCollectionCheckbox().isUnchecked();
    performancePage.garbageCollectionCheckbox().set();
    performancePage.garbageCollectionCheckbox().isChecked();
    performancePage.applyAndWait('garbageCollection-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":true');
    });

    // Disable garbage collection
    performancePage.garbageCollectionCheckbox().isChecked();
    performancePage.garbageCollectionCheckbox().set();
    performancePage.garbageCollectionCheckbox().isUnchecked();
    performancePage.applyAndWait('garbageCollection-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"garbageCollection\":{\"enabled\":false');
    });
  });

  it('can toggle require namespace filtering', () => {
    performancePage.goTo();

    // Enable require namespace filtering
    performancePage.namespaceFilteringCheckbox().isUnchecked();
    performancePage.namespaceFilteringCheckbox().set();

    const cardPo = new CardPo();

    cardPo.getBody().contains('Required Namespace / Project Filtering is incomaptible with Manual Refresh and Incremental Loading. Enabling this will disable them.');
    cardPo.getActionButton().contains('Enable').click();
    performancePage.namespaceFilteringCheckbox().isChecked();
    performancePage.applyAndWait('forceNsFilterV2-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":true');
    });

    // Disable require namespace filtering
    performancePage.namespaceFilteringCheckbox().isChecked();
    performancePage.namespaceFilteringCheckbox().set();
    performancePage.namespaceFilteringCheckbox().isUnchecked();
    performancePage.applyAndWait('forceNsFilterV2-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"forceNsFilterV2\":{\"enabled\":false');
    });

    // Reenable incremental loading: this is disabled when we enable 'require namespace filtering'
    performancePage.incrementalLoadingCheckbox().isUnchecked();
    performancePage.incrementalLoadingCheckbox().set();
    performancePage.incrementalLoadingCheckbox().isChecked();
    performancePage.applyAndWait().then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"incrementalLoading\":{\"enabled\":true');
    });
  });

  it('can toggle websocket web worker', () => {
    performancePage.goTo();

    // Enable websocket web worker
    performancePage.websocketWebWorkerCheckbox().isUnchecked();
    performancePage.websocketWebWorkerCheckbox().set();
    performancePage.websocketWebWorkerCheckbox().isChecked();
    performancePage.applyAndWait('advancedWorker-true').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":true');
      expect(response?.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":true');
    });

    // Disable websocket web worker
    performancePage.websocketWebWorkerCheckbox().isChecked();
    performancePage.websocketWebWorkerCheckbox().set();
    performancePage.websocketWebWorkerCheckbox().isUnchecked();
    performancePage.applyAndWait('advancedWorker-false').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":false');
      expect(response?.body).to.have.property('value').contains('\"advancedWorker\":{\"enabled\":false');
    });
  });
});
