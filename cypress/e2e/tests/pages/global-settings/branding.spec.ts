import { BrandingPagePo } from '@/cypress/e2e/po/pages/global-settings/branding.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

const loginPage = new LoginPagePo();
const homePage = new HomePagePo();
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
    homePage.goTo();
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
    // https://github.com/rancher/dashboard/issues/10010
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Global Settings');

    // catching regression https://github.com/rancher/dashboard/issues/10576
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local', false);

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
    cy.title({ timeout: 2000 }).should('eq', settings.privateLabel.original);
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
    brandingPage.logoPreview('dark').scrollIntoView().should('be.visible');
    brandingPage.logoPreview('light').scrollIntoView().should('be.visible');

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
      expect(el).to.have.attr('src').includes('/img/rancher-logo');
    });

    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes('/img/rancher-logo');
    });
  });

  it('Banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
    const prefPage = new PreferencesPagePo();

    BrandingPagePo.navTo();
    brandingPage.customBannerCheckbox().set();
    brandingPage.customBannerCheckbox().hasAppropriateWidth();
    brandingPage.customBannerCheckbox().hasAppropriateHeight();

    // Upload Light Banner
    brandingPage.uploadButton('Upload Light Banner')
      .selectFile('cypress/e2e/blueprints/branding/banners/banner-light.svg', { force: true });

    // Upload Dark Banner
    brandingPage.uploadButton('Upload Dark Banner')
      .selectFile('cypress/e2e/blueprints/branding/banners/banner-dark.svg', { force: true });

    // Apply
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-banner-light', 200);

    // Banner Preview
    brandingPage.bannerPreview('dark').scrollIntoView().should('be.visible');
    brandingPage.bannerPreview('light').scrollIntoView().should('be.visible');

    // Set dashboard theme to Light and check homepage for updated banner in dark mode
    PreferencesPagePo.navTo();
    prefPage.themeButtons().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdateDark');
    prefPage.themeButtons().set('Dark');
    cy.wait('@prefUpdateDark').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme', '"ui-dark"');
      expect(response?.body.data).to.have.property('theme', '"ui-dark"');
    });

    cy.fixture('branding/banners/banner-dark.svg', 'base64').then((expectedBase64) => {
      homePage.goTo();
      homePage.getBrandBannerImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);
    });

    // Set dashboard theme to Light and check homepage for updated banner in light mode
    PreferencesPagePo.navTo();
    prefPage.themeButtons().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdateLight');
    prefPage.themeButtons().set('Light');
    cy.wait('@prefUpdateLight').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme', '"ui-light"');
      expect(response?.body.data).to.have.property('theme', '"ui-light"');
    });

    cy.fixture('branding/banners/banner-light.svg', 'base64').then((expectedBase64) => {
      homePage.goTo();
      homePage.getBrandBannerImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);
    });

    // Reset
    BrandingPagePo.navTo();
    brandingPage.customBannerCheckbox().set();
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-banner-light', 200);

    homePage.goTo();
    homePage.getBrandBannerImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes('/img/banner');
    });
  });

  it('Login Background', { tags: ['@globalSettings', '@adminUser'] }, () => {
    const prefPage = new PreferencesPagePo();

    BrandingPagePo.navTo();

    brandingPage.customLoginBackgroundCheckbox().set();
    brandingPage.customLoginBackgroundCheckbox().hasAppropriateWidth();
    brandingPage.customLoginBackgroundCheckbox().hasAppropriateHeight();

    // Upload Light Background
    brandingPage.uploadButton('Upload Light Background')
      .selectFile('cypress/e2e/blueprints/branding/backgrounds/login-landscape-light.svg', { force: true });

    // Upload Dark Background
    brandingPage.uploadButton('Upload Dark Background')
      .selectFile('cypress/e2e/blueprints/branding/backgrounds/login-landscape-dark.svg', { force: true });

    // Apply
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-login-background-light', 200);

    // Banner Preview
    brandingPage.loginBackgroundPreview('dark').scrollIntoView().should('be.visible');
    brandingPage.loginBackgroundPreview('light').scrollIntoView().should('be.visible');

    // Set dashboard theme to Dark and check login page for updated background in dark mode
    PreferencesPagePo.navTo();
    prefPage.themeButtons().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdateDark');
    prefPage.themeButtons().set('Dark');
    cy.wait('@prefUpdateDark').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme', '"ui-dark"');
      expect(response?.body.data).to.have.property('theme', '"ui-dark"');
    });

    cy.fixture('branding/backgrounds/login-landscape-dark.svg', 'base64').then((expectedBase64) => {
      loginPage.goTo();
      loginPage.loginBackgroundImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);
    });

    cy.login();
    HomePagePo.goToAndWaitForGet();

    // Set dashboard theme to Dark and check login page for updated background in light mode
    PreferencesPagePo.navTo();
    prefPage.themeButtons().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdateLight');
    prefPage.themeButtons().set('Light');
    cy.wait('@prefUpdateLight').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme', '"ui-light"');
      expect(response?.body.data).to.have.property('theme', '"ui-light"');
    });

    cy.fixture('branding/backgrounds/login-landscape-light.svg', 'base64').then((expectedBase64) => {
      loginPage.goTo();
      loginPage.loginBackgroundImage().should('be.visible').and('have.attr', 'src', `data:image/svg+xml;base64,${ expectedBase64 }`);
    });

    cy.login();
    HomePagePo.goToAndWaitForGet();

    // Reset
    BrandingPagePo.navTo();
    brandingPage.customLoginBackgroundCheckbox().set();
    brandingPage.applyAndWait('/v1/management.cattle.io.settings/ui-login-background-light', 200);

    loginPage.goTo();
    loginPage.loginBackgroundImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes('/img/login-landscape');
    });

    cy.login();
    HomePagePo.goToAndWaitForGet();
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
      expect(background).to.satisfy((b) => b.startsWith(settings.primaryColor.newRGB));
    });

    // Check over reload
    cy.reload();
    brandingPage.primaryColorPicker().value().should('eq', settings.primaryColor.new);
    brandingPage.primaryColorPicker().previewColor().should('eq', settings.primaryColor.newRGB);
    brandingPage.applyButton().self().should('have.css', 'background').should((background: string) => {
      expect(background).to.satisfy((b) => b.startsWith(settings.primaryColor.newRGB));
    });

    // check that login page has new styles applied
    // https://github.com/rancher/dashboard/issues/10788
    loginPage.goTo();

    loginPage.submitButton().self().should('have.css', 'background').should((background: string) => {
      expect(background).to.satisfy((b) => b.startsWith(settings.primaryColor.newRGB));
    });

    cy.reload();

    loginPage.submitButton().self().should('have.css', 'background').should((background: string) => {
      expect(background).to.satisfy((b) => b.startsWith(settings.primaryColor.newRGB));
    });
    // EO test https://github.com/rancher/dashboard/issues/10788

    cy.login();
    HomePagePo.goToAndWaitForGet();
    BrandingPagePo.navTo();

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

    // check that login page has new styles applied
    // https://github.com/rancher/dashboard/issues/10788
    loginPage.goTo();

    loginPage.password().showBtn().should('have.css', 'color').should((color: string) => {
      expect(color).to.satisfy((b) => b.startsWith(settings.linkColor.newRGB));
    });

    cy.reload();

    loginPage.password().showBtn().should('have.css', 'color').should((color: string) => {
      expect(color).to.satisfy((b) => b.startsWith(settings.linkColor.newRGB));
    });
    // EO test https://github.com/rancher/dashboard/issues/10788

    cy.login();
    HomePagePo.goToAndWaitForGet();
    BrandingPagePo.navTo();

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
