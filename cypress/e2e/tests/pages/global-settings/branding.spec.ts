import { BrandingPagePo } from '@/cypress/e2e/po/pages/global-settings/branding.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

const settings = {
  privateLabel: {
    original: 'Rancher',
    new:      'Rancher e2e'
  },
  primaryColor: {
    original: '#3d98d3', // 3D98D3
    new:      '#f80dd8',
    newRGB:   'rgb(248, 13, 216)', // 'rgb(220, 222, 231)'
  },
  linkColor: {
    original: '#3d98d3', // #3D98D3
    new:      '#ddd603', // #DDD603
    newRGB:   'rgb(221, 214, 3)'
  }
};

describe('Branding', () => {
  // If we need to speed tests up these should be combined into a single `it` (so only one page load and one refresh is used)
  beforeEach(() => {
    cy.login();
  });

  it('Can navigate to Branding Page', { tags: ['@adminUser', '@standardUser'] }, () => {
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

    const brandingNavItem = productMenu.visibleNavTypes().contains('Branding');

    brandingNavItem.should('exist');
    brandingNavItem.click();

    const brandingPage = new BrandingPagePo();

    brandingPage.waitForPageWithClusterId();
  });

  it('Private Label', { tags: '@adminUser' }, () => {
    const brandingPage = new BrandingPagePo();

    brandingPage.goTo();

    // Set
    // brandingPage.privateLabel().value().should(`eq ${ settings.privateLabel.original }`);
    cy.title().should('not.eq', settings.privateLabel.new);
    brandingPage.privateLabel().set(settings.privateLabel.new);
    brandingPage.applyAndWait('**/ui-pl');

    // Visit the Home Page
    BurgerMenuPo.toggle();
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.home().click();

    const homePage = new HomePagePo();

    homePage.title().should('eq', `Welcome to ${ settings.privateLabel.new }`);

    // Check in session
    cy.title().should('eq', settings.privateLabel.new);

    // Check over reload
    cy.reload();
    cy.title().should('eq', settings.privateLabel.new);

    brandingPage.goTo();

    // Reset
    brandingPage.privateLabel().set(settings.privateLabel.original);
    brandingPage.applyAndWait('**/ui-pl');
    cy.title().should('eq', settings.privateLabel.original);
  });

  it.skip('Support Links', () => {
    // Liable to change following Prime changes
  });

  it.skip('Logo', () => {
    // Requires a way to check the actual image changes
  });

  it.skip('Favicon', () => {
    // Requires a way to check the actual image changes
  });

  it('Primary Color', { tags: '@adminUser' }, () => {
    const brandingPage = new BrandingPagePo();

    brandingPage.goTo();

    // Set
    brandingPage.primaryColorCheckbox().set();
    brandingPage.primaryColorPicker().value().should('not.eq', settings.primaryColor.new);
    brandingPage.primaryColorPicker().set(settings.primaryColor.new);
    brandingPage.applyAndWait('**/ui-primary-color');

    // Check in session
    brandingPage.primaryColorPicker().value().should('eq', settings.primaryColor.new);
    brandingPage.primaryColorPicker().previewColor().should('eq', settings.primaryColor.newRGB);
    brandingPage.applyButton().self().should('have.css', 'background').should((background: string) => {
      expect(background).to.satisfy((b: string) => b.startsWith(settings.primaryColor.newRGB));
    });

    // Check over reload
    cy.reload();
    brandingPage.primaryColorPicker().value().should('eq', settings.primaryColor.new);
    brandingPage.primaryColorPicker().previewColor().should('eq', settings.primaryColor.newRGB);
    brandingPage.applyButton().self().should('have.css', 'background').should((background: string) => {
      expect(background).to.satisfy((b: string) => b.startsWith(settings.primaryColor.newRGB));
    });

    // Reset
    brandingPage.primaryColorPicker().set(settings.primaryColor.original);
    brandingPage.primaryColorCheckbox().set();
    brandingPage.applyAndWait('**/ui-primary-color');
  });

  it('Link Color', { tags: '@adminUser' }, () => {
    const brandingPage = new BrandingPagePo();

    brandingPage.goTo();

    // Set
    brandingPage.linkColorCheckbox().set();
    brandingPage.linkColorPicker().value().should('not.eq', settings.linkColor.new);
    brandingPage.linkColorPicker().set(settings.linkColor.new);
    brandingPage.applyAndWait('**/ui-link-color');

    // Check in session
    brandingPage.linkColorPicker().value().should('eq', settings.linkColor.new);
    brandingPage.linkColorPicker().previewColor().should('eq', settings.linkColor.newRGB);

    // Check over reload
    cy.reload();
    brandingPage.linkColorPicker().value().should('eq', settings.linkColor.new);
    brandingPage.linkColorPicker().previewColor().should('eq', settings.linkColor.newRGB);

    // Reset
    brandingPage.linkColorPicker().set(settings.linkColor.original);
    brandingPage.linkColorCheckbox().set();
    brandingPage.applyAndWait('**/ui-link-color');
  });
});
