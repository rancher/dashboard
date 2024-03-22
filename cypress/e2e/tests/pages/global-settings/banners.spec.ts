import { BannersPagePo } from '@/cypress/e2e/po/pages/global-settings/banners.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

const bannersPage = new BannersPagePo();
const burgerMenu = new BurgerMenuPo();
const loginPage = new LoginPagePo();
const bannersSettingsOriginal = [];

const settings = {
  bannerLabel:   'Rancher e2e',
  textAlignment: {
    original: 'Center',
    new:      'Right'
  },
  fontSize: {
    original: '14px',
    new:      '20px'
  },
  textDecoration:  'Underline',
  bannerTextColor: {
    original: '#141419',
    new:      '#f80dd8',
    newRGB:   'rgb(248, 13, 216)',
  },
  bannerBackgroundColor: {
    original: '#EEEFF4',
    new:      '#ddd603',
    newRGB:   'rgb(221, 214, 3)'
  }

};

describe('Banners', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();

    cy.getRancherResource('v1', 'management.cattle.io.settings', 'ui-banners', null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      bannersSettingsOriginal.push(body);
    });
  });

  it('can navigate to Banners Page', { tags: ['@globalSettings', '@adminUser', '@standardUser'] }, () => {
    const productMenu = new ProductNavPo();

    BurgerMenuPo.toggle();

    burgerMenu.categories().contains(` Configuration `).should('exist');
    const globalSettingsNavItem = burgerMenu.links().contains(`Global Settings`);

    globalSettingsNavItem.should('exist');
    globalSettingsNavItem.click();
    const settingsPage = new SettingsPagePo('_');

    settingsPage.waitForPageWithClusterId();

    const bannersNavItem = productMenu.visibleNavTypes().contains('Banners');

    bannersNavItem.should('exist');
    bannersNavItem.click();

    bannersPage.waitForPageWithClusterId();
  });

  let restoreSettings = false;

  it('can show and hide Header Banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
    BannersPagePo.navTo();

    // Show Banner
    bannersPage.headerBannerCheckbox().set();
    // to check custom box element width and height in order to prevent regression
    // https://github.com/rancher/dashboard/issues/10000
    bannersPage.headerBannerCheckbox().hasAppropriateWidth();
    bannersPage.headerBannerCheckbox().hasAppropriateHeight();
    bannersPage.headerInput().set(settings.bannerLabel);
    bannersPage.textAlignmentRadioGroup('bannerHeader').set(2);
    bannersPage.textDecorationCheckboxes('bannerHeader', 'Underline').set();
    bannersPage.selectFontSizeByValue('bannerHeader', settings.fontSize.new);
    bannersPage.textColorPicker(0).value().should('not.eq', settings.bannerTextColor.new);
    bannersPage.textColorPicker(0).set(settings.bannerTextColor.new);
    bannersPage.textColorPicker(1).value().should('not.eq', settings.bannerBackgroundColor.new);
    bannersPage.textColorPicker(1).set(settings.bannerBackgroundColor.new);
    bannersPage.applyAndWait('**/ui-banners').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      restoreSettings = true;
    });

    // Check in session
    bannersPage.banner().should('be.visible').then((el) => {
      expect(el).to.have.attr('style').contains(`color: ${ settings.bannerTextColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`background-color: ${ settings.bannerBackgroundColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`text-align: ${ settings.textAlignment.new.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`ext-decoration: ${ settings.textDecoration.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`font-size: ${ settings.fontSize.new }`);
    });
    bannersPage.headerBannerCheckbox().isChecked();
    bannersPage.textAlignmentRadioGroup('bannerHeader').isChecked(2);
    bannersPage.textColorPicker(0).previewColor().should('eq', settings.bannerTextColor.newRGB);
    bannersPage.textColorPicker(1).previewColor().should('eq', settings.bannerBackgroundColor.newRGB);

    // Check over reload
    cy.reload();
    bannersPage.banner().should('be.visible').then((el) => {
      expect(el).to.have.attr('style').contains(`color: ${ settings.bannerTextColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`background-color: ${ settings.bannerBackgroundColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`text-align: ${ settings.textAlignment.new.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`ext-decoration: ${ settings.textDecoration.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`font-size: ${ settings.fontSize.new }`);
    });
    bannersPage.headerBannerCheckbox().isChecked();
    bannersPage.textAlignmentRadioGroup('bannerHeader').isChecked(2);
    bannersPage.textColorPicker(0).previewColor().should('eq', settings.bannerTextColor.newRGB);
    bannersPage.textColorPicker(1).previewColor().should('eq', settings.bannerBackgroundColor.newRGB);

    // Hide Banner
    bannersPage.headerBannerCheckbox().set();
    bannersPage.applyAndWait('**/ui-banners', 200);
    bannersPage.banner().should('not.exist');
  });

  it('can show and hide Footer Banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
    bannersPage.goTo();

    // Show Banner
    bannersPage.footerBannerCheckbox().set();
    bannersPage.footerInput().set(settings.bannerLabel);
    bannersPage.textAlignmentRadioGroup('bannerFooter').set(2);
    bannersPage.textDecorationCheckboxes('bannerFooter', 'Underline').set();
    bannersPage.selectFontSizeByValue('bannerFooter', settings.fontSize.new);
    bannersPage.textColorPicker(2).value().should('not.eq', settings.bannerTextColor.new);
    bannersPage.textColorPicker(2).set(settings.bannerTextColor.new);
    bannersPage.textColorPicker(3).value().should('not.eq', settings.bannerBackgroundColor.new);
    bannersPage.textColorPicker(3).set(settings.bannerBackgroundColor.new);
    bannersPage.applyAndWait('**/ui-banners').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      restoreSettings = true;
    });

    // Check in session
    bannersPage.banner().should('be.visible').then((el) => {
      expect(el).to.have.attr('style').contains(`color: ${ settings.bannerTextColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`background-color: ${ settings.bannerBackgroundColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`text-align: ${ settings.textAlignment.new.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`ext-decoration: ${ settings.textDecoration.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`font-size: ${ settings.fontSize.new }`);
    });
    bannersPage.footerBannerCheckbox().isChecked();
    bannersPage.textAlignmentRadioGroup('bannerFooter').isChecked(2);
    bannersPage.textColorPicker(2).previewColor().should('eq', settings.bannerTextColor.newRGB);
    bannersPage.textColorPicker(3).previewColor().should('eq', settings.bannerBackgroundColor.newRGB);

    // Check over reload
    cy.reload();
    bannersPage.banner().should('be.visible').then((el) => {
      expect(el).to.have.attr('style').contains(`color: ${ settings.bannerTextColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`background-color: ${ settings.bannerBackgroundColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`text-align: ${ settings.textAlignment.new.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`ext-decoration: ${ settings.textDecoration.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`font-size: ${ settings.fontSize.new }`);
    });
    bannersPage.footerBannerCheckbox().isChecked();
    bannersPage.textAlignmentRadioGroup('bannerFooter').isChecked(2);
    bannersPage.textColorPicker(2).previewColor().should('eq', settings.bannerTextColor.newRGB);
    bannersPage.textColorPicker(3).previewColor().should('eq', settings.bannerBackgroundColor.newRGB);

    // Hide Banner
    bannersPage.footerBannerCheckbox().set();
    bannersPage.applyAndWait('**/ui-banners', 200);
    bannersPage.banner().should('not.exist');
  });

  it('can show and hide Login Screen Banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
    cy.login(undefined, undefined, false);
    BannersPagePo.navTo();

    // Show Banner
    bannersPage.loginScreenBannerCheckbox().checkVisible();
    bannersPage.loginScreenBannerCheckbox().set();
    bannersPage.loginScreenInput().set(settings.bannerLabel);
    bannersPage.textAlignmentRadioGroup('bannerConsent').set(2);
    bannersPage.textDecorationCheckboxes('bannerConsent', 'Underline').set();
    bannersPage.selectFontSizeByValue('bannerConsent', settings.fontSize.new);
    bannersPage.textColorPicker(4).value().should('not.eq', settings.bannerTextColor.new);
    bannersPage.textColorPicker(4).set(settings.bannerTextColor.new);
    bannersPage.textColorPicker(5).value().should('not.eq', settings.bannerBackgroundColor.new);
    bannersPage.textColorPicker(5).set(settings.bannerBackgroundColor.new);
    bannersPage.applyAndWait('**/ui-banners').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      restoreSettings = true;
    });

    // Check login screen
    cy.logout();
    loginPage.waitForPage();
    loginPage.loginPageMessage().contains('You have been logged out.').should('be.visible');
    bannersPage.banner().should('be.visible').then((el) => {
      expect(el).to.have.attr('style').contains(`color: ${ settings.bannerTextColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`background-color: ${ settings.bannerBackgroundColor.newRGB }`);
      expect(el).to.have.attr('style').contains(`text-align: ${ settings.textAlignment.new.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`ext-decoration: ${ settings.textDecoration.toLowerCase() }`);
      expect(el).to.have.attr('style').contains(`font-size: ${ settings.fontSize.new }`);
    });

    // Check after login
    cy.login(undefined, undefined, false);
    BannersPagePo.navTo();
    bannersPage.loginScreenBannerCheckbox().isChecked();
    bannersPage.textAlignmentRadioGroup('bannerConsent').isChecked(2);
    bannersPage.textColorPicker(4).previewColor().should('eq', settings.bannerTextColor.newRGB);
    bannersPage.textColorPicker(5).previewColor().should('eq', settings.bannerBackgroundColor.newRGB);

    // Hide banner
    bannersPage.loginScreenBannerCheckbox().set();
    bannersPage.applyAndWait('**/ui-banners', 200);

    // Check login screen
    cy.logout();
    loginPage.waitForPage();
    loginPage.loginPageMessage().contains('You have been logged out.').should('be.visible');
    bannersPage.banner().should('not.exist');
  });

  // Note: This test needs to be in its own `describe` with two `it` blocks for Show and Hide scenarios.
  // 401 error is throw when the user attempts to login with valid credentials the second time
  // which unexpectedly fails the test. This an automation specific issue it seems
  describe('Login Failed Banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
    it('Show Banner', () => {
      cy.login(undefined, undefined, false);
      BannersPagePo.navTo();

      // Show Banner
      bannersPage.loginErrorCheckbox().checkVisible();
      bannersPage.loginErrorCheckbox().set();
      bannersPage.loginErrorInput().set(settings.bannerLabel);
      bannersPage.applyAndWait('**/ui-banners').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        restoreSettings = true;
      });

      // Check login screen
      cy.logout();
      loginPage.waitForPage();
      loginPage.loginPageMessage().contains('You have been logged out.').should('be.visible');
      loginPage.submit();
      loginPage.waitForPage();
      cy.contains(settings.bannerLabel).should('be.visible');
    });

    it('Hide banner', () => {
      cy.login(undefined, undefined, false);
      BannersPagePo.navTo();

      // Hide banner
      bannersPage.loginErrorCheckbox().checkVisible();
      bannersPage.loginErrorCheckbox().set();
      bannersPage.applyAndWait('**/ui-banners').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        restoreSettings = true;
      });

      // Check login screen
      cy.logout();
      loginPage.waitForPage();
      loginPage.loginPageMessage().contains('You have been logged out.').should('be.visible');
      cy.contains(settings.bannerLabel).should('not.exist');
    });
  });

  it('standard user has only read access to Banner page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action buttons/checkboxes etc. are disabled/hidden for standard user
    BannersPagePo.navTo();
    bannersPage.headerBannerCheckbox().isDisabled();
    bannersPage.footerBannerCheckbox().isDisabled();
    bannersPage.loginScreenBannerCheckbox().isDisabled();
    bannersPage.loginErrorCheckbox().isDisabled();
    bannersPage.applyButton().checkNotExists();
  });

  after('set default banners settings', () => {
    if (restoreSettings) {
      cy.login(undefined, undefined, true);

      // get most updated version of banners info
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'ui-banners', null).then((resp: Cypress.Response<any>) => {
        const response = resp.body.metadata;

        // update original data before sending request
        bannersSettingsOriginal[0].metadata.resourceVersion = response.resourceVersion;

        cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-banners', bannersSettingsOriginal[0]);
      });
    }
  });
});
