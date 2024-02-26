import { BrandingPagePo } from '@/cypress/e2e/po/pages/global-settings/branding.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';

const brandingPage = new BrandingPagePo();
const burgerMenu = new BurgerMenuPo();

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

describe('Branding', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Can navigate to Branding Page', { tags: ['@globalSettings', '@adminUser', '@standardUser'] }, () => {
    const productMenu = new ProductNavPo();

    BurgerMenuPo.toggle();

    const globalSettingsNavItem = burgerMenu.links().contains(`Global Settings`);

    globalSettingsNavItem.should('exist');
    globalSettingsNavItem.click();
    const settingsPage = new SettingsPagePo('_');

    settingsPage.waitForPageWithClusterId();

    // check if burguer menu nav is highlighted correctly for Global Settings
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Global Settings');

    const brandingNavItem = productMenu.visibleNavTypes().contains('Branding');

    brandingNavItem.should('exist');
    brandingNavItem.click();

    brandingPage.waitForPageWithClusterId();
  });

  it('Private Label', { tags: ['@globalSettings', '@adminUser'] }, () => {
    const brandingPage = new BrandingPagePo();

    BrandingPagePo.navTo();

    // Set
    cy.title().should('not.eq', settings.privateLabel.new);
    brandingPage.privateLabel().set(settings.privateLabel.new);
    brandingPage.applyAndWait('**/ui-pl', 200);

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

    BrandingPagePo.navTo();

    // Reset
    brandingPage.privateLabel().set(settings.privateLabel.original);
    brandingPage.applyAndWait('**/ui-pl', 200);
    BurgerMenuPo.toggle();
    burgerMenuPo.home().click();
    cy.title().should('eq', settings.privateLabel.original);
  });

  it('Logo', { tags: ['@globalSettings', '@adminUser'] }, () => {
    const prefPage = new PreferencesPagePo();

    BrandingPagePo.navTo();
    brandingPage.customLogoCheckbox().set();
    // to check custom box element width and height in order to prevent regression
    // https://github.com/rancher/dashboard/issues/10000
    brandingPage.customLogoCheckbox().hasAppropriateWidth();
    brandingPage.customLogoCheckbox().hasAppropriateHeight();

    // Upload Light Logo
    brandingPage.uploadButton('Upload Light Logo')
      .selectFile('cypress/e2e/blueprints/branding/logos/rancher-color.svg', { force: true });

    // Upload Dark Logo
    brandingPage.uploadButton('Upload Dark Logo')
      .selectFile('cypress/e2e/blueprints/branding/logos/rancher-white.svg', { force: true });

    // Apply
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-logo-light', 200);

    // Logo Preview
    brandingPage.logoPreview('dark').should('be.visible');
    brandingPage.logoPreview('light').should('be.visible');

    // Set dashboard theme to Dark and check top-level navigation header for updated logo in dark mode
    PreferencesPagePo.navTo();
    prefPage.themeButtons().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdateDark');
    prefPage.themeButtons().set('Dark');
    cy.wait('@prefUpdateDark').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme', '"ui-dark"');
      expect(response?.body.data).to.have.property('theme', '"ui-dark"');
    });

    cy.fixture('branding/logos/rancher-white.svg', 'base64').then((expectedBase64) => {
      burgerMenu.headerBrandLogoImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);

      BurgerMenuPo.toggle();
      burgerMenu.brandLogoImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);
      BurgerMenuPo.toggle();
    });
    // Set dashboard theme to Light and check top-level navigation header for updated logo in light mode
    PreferencesPagePo.navTo();
    prefPage.themeButtons().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdateLight');
    prefPage.themeButtons().set('Light');
    cy.wait('@prefUpdateLight').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme', '"ui-light"');
      expect(response?.body.data).to.have.property('theme', '"ui-light"');
    });

    cy.fixture('branding/logos/rancher-color.svg', 'base64').then((expectedBase64) => {
      burgerMenu.headerBrandLogoImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);

      BurgerMenuPo.toggle();
      burgerMenu.brandLogoImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);
    });

    // Reset
    BrandingPagePo.navTo();
    brandingPage.customLogoCheckbox().set();
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-logo-light', 200);

    HomePagePo.navTo();
    burgerMenu.headerBrandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes('/img/rancher-logo.66cf5910.svg');
    });

    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes('/img/rancher-logo.66cf5910.svg');
    });
  });

  it.skip('Login Background', { tags: ['@globalSettings', '@adminUser'] }, () => {
    BrandingPagePo.navTo();
    brandingPage.customLoginBackgroundCheckbox().set();
    // to check custom box element width and height in order to prevent regression
    // https://github.com/rancher/dashboard/issues/10000
    brandingPage.customLoginBackgroundCheckbox().hasAppropriateWidth();
    brandingPage.customLoginBackgroundCheckbox().hasAppropriateHeight();

    brandingPage.uploadButton('Upload Light Login Background')
      .selectFile('cypress/e2e/blueprints/branding/backgrounds/login-landscape-light.svg', { force: true });

    brandingPage.uploadButton('Upload Dark Login Background')
      .selectFile('cypress/e2e/blueprints/branding/backgrounds/login-landscape-dark.svg', { force: true });

    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-login-background-light', 200);

    brandingPage.loginBackgroundPreview('dark').should('be.visible');
    brandingPage.loginBackgroundPreview('light').should('be.visible');
  });

  it('Favicon', { tags: ['@globalSettings', '@adminUser'] }, () => {
    BrandingPagePo.navTo();
    brandingPage.customFaviconCheckbox().set();

    // Upload Favicon
    brandingPage.uploadButton('Upload Favicon')
      .selectFile('cypress/e2e/blueprints/global/favicons/custom-favicon.svg', { force: true });

    // Apply
    cy.fixture('global/favicons/custom-favicon.svg', 'base64').then((expectedBase64) => {
      brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-favicon').then(({ response, request }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body).to.have.property('value', `data:image/svg+xml;base64,${ expectedBase64 }`);
        expect(response?.body).to.have.property('value', `data:image/svg+xml;base64,${ expectedBase64 }`);
      });

      // Favicon Preview
      brandingPage.faviconPreview().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);

      // Favicon in header
      cy.get('head link[rel="shortcut icon"]').should('have.attr', 'href', `data:image/svg+xml;base64,${ expectedBase64 }`);
    });

    // Reset
    brandingPage.customFaviconCheckbox().set();
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-favicon', 200);
    cy.get('head link[rel="shortcut icon"]').then((el) => {
      expect(el).attr('href').to.include('/favicon.png');
    });
  });

  it('Primary Color', { tags: ['@globalSettings', '@adminUser'] }, () => {
    const brandingPage = new BrandingPagePo();

    BrandingPagePo.navTo();

    // Set
    brandingPage.primaryColorCheckbox().set();
    brandingPage.primaryColorPicker().value().should('not.eq', settings.primaryColor.new);
    brandingPage.primaryColorPicker().set(settings.primaryColor.new);
    brandingPage.applyAndWait('**/ui-primary-color', 200);

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
    brandingPage.applyAndWait('**/ui-primary-color', 200);
  });

  it('Link Color', { tags: ['@globalSettings', '@adminUser'] }, () => {
    const brandingPage = new BrandingPagePo();

    brandingPage.goTo();

    // Set
    brandingPage.linkColorCheckbox().set();
    brandingPage.linkColorPicker().value().should('not.eq', settings.linkColor.new);
    brandingPage.linkColorPicker().set(settings.linkColor.new);
    brandingPage.applyAndWait('**/ui-link-color', 200);

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
    brandingPage.applyAndWait('**/ui-link-color', 200);
  });

  it('standard user has only read access to Branding page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action buttons/checkboxes etc. are disabled/hidden for standard user
    BrandingPagePo.navTo();
    brandingPage.privateLabel().self().should('be.disabled');
    brandingPage.customLogoCheckbox().isDisabled();
    brandingPage.customFaviconCheckbox().isDisabled();
    brandingPage.primaryColorCheckbox().isDisabled();
    brandingPage.linkColorCheckbox().isDisabled();
    brandingPage.applyButton().checkNotExists();
  });
});
