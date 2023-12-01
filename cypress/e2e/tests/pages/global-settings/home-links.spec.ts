import { HomeLinksPagePo } from '~/cypress/e2e/po/pages/global-settings/home-links.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

const homeLinksPage = new HomeLinksPagePo();
const homePage = new HomePagePo();

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

describe('Home Links', () => {
  // If we need to speed tests up these should be combined into a single `it` (so only one page load and one refresh is used)
  beforeEach(() => {
    cy.login();
  });

  it('can navigate to Home Links page', { tags: ['@adminUser', '@standardUser'] }, () => {
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

    const homeLinksPageNavItem = productMenu.visibleNavTypes().contains('Home Links');

    homeLinksPageNavItem.should('exist');
    homeLinksPageNavItem.click();

    homeLinksPage.waitForPageWithClusterId();
  });

  it('can hide or show default links on the Home Page', { tags: ['@adminUser'] }, () => {
    homeLinksPage.goTo();

    // Hide all links
    homeLinksPage.selectCheckbox(0).set();
    homeLinksPage.selectCheckbox(1).set();
    homeLinksPage.selectCheckbox(2).set();
    homeLinksPage.selectCheckbox(3).set();
    homeLinksPage.selectCheckbox(4).set();
    homeLinksPage.applyAndWait('/v1/management.cattle.io.settings/ui-custom-links');

    HomePagePo.goTo();
    homePage.supportLinks().should('have.length', 1).contains('Commercial Support');

    homeLinksPage.goTo();

    // Show all links
    homeLinksPage.selectCheckbox(0).set();
    homeLinksPage.selectCheckbox(1).set();
    homeLinksPage.selectCheckbox(2).set();
    homeLinksPage.selectCheckbox(3).set();
    homeLinksPage.selectCheckbox(4).set();
    homeLinksPage.applyAndWait('/v1/management.cattle.io.settings/ui-custom-links');

    HomePagePo.goTo();
    homePage.supportLinks().should('have.length', 6);
  });

  it('can add and remove custom links', { tags: ['@adminUser'] }, () => {
    // Note: need to click 'Apply' button twice in this test due to race condition. Test will fail unexpectedly without it.
    const customLinkName = `${ runPrefix }-custom-link`;
    const customLinkUrl = `https://${ runPrefix }/custom/link/url`;

    // Add custom link
    homeLinksPage.goTo();
    homeLinksPage.addLinkButton().click();
    homeLinksPage.displayTextInput().set(customLinkName);
    homeLinksPage.urlInput().set(customLinkUrl);

    cy.intercept('PUT', '/v1/management.cattle.io.settings/ui-custom-links').as('linksUpdated');
    homeLinksPage.applyButton().apply();
    homeLinksPage.applyButton().apply();
    cy.wait(['@linksUpdated', '@linksUpdated']);
    HomePagePo.goTo();
    homePage.supportLinks().contains(customLinkName).should('have.attr', 'href', `${ customLinkUrl }`);

    // Remove custom link
    homeLinksPage.goTo();
    homeLinksPage.removeLinkButton().click();
    homeLinksPage.applyButton().apply();
    homeLinksPage.applyButton().apply();
    cy.wait(['@linksUpdated', '@linksUpdated']);
    homeLinksPage.displayTextInput().checkNotExists();
    homeLinksPage.removeLinkButton().should('not.exist');

    HomePagePo.goTo();
    homePage.supportLinks().contains(customLinkName).should('not.exist');
  });

  it('standard user has only read access to Home Links page', { tags: '@standardUser' }, () => {
    // verify action buttons/checkboxes are hidden for standard user
    homeLinksPage.waitForRequests();
    homeLinksPage.selectCheckbox(0).checkNotExists();
    homeLinksPage.applyButton().checkNotExists();
  });
});
