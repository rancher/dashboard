import { BannersPagePo } from '@/cypress/e2e/po/pages/global-settings/banners.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import FixedBannerPo from '~/cypress/e2e/po/components/fixed-banner.po';

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

  describe('Standard Banner Configuration', () => {
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
  });

  // Tests for the individual banner settings behavior

  function updateBannersSetting(fn) {
    cy.getRancherResource('v1', 'management.cattle.io.settings').then((data: any) => {
      const banners = data.body.data.find((setting) => setting.id === 'ui-banners');
      const value = JSON.parse(banners.value);

      fn(value);

      banners.value = JSON.stringify(value);

      cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-banners', banners);
    });
  }

  function updateIndividualBannersSetting(id, value = null) {
    cy.getRancherResource('v1', 'management.cattle.io.settings').then((data: any) => {
      const banner = data.body.data.find((setting) => setting.id === id);

      // Update the banner value to be the stringified JSON of the value
      banner.value = value === null ? '' : JSON.stringify(value);

      cy.setRancherResource('v1', 'management.cattle.io.settings', id, banner);
    });
  }

  // Common tests for Header and Footer banners
  function bannerTests(bannerName: string) {
    before(() => {
      cy.then(() => Cypress.session.clearAllSavedSessions());
      cy.login();

      // Make sure banner is not shown from the ui-banners setting for this banner
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'false';
      });

      HomePagePo.goTo();
    });

    it('Should not have banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
      const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();
    });

    it('Should use banner from ui-banners setting', { tags: ['@globalSettings', '@adminUser'] }, () => {
      const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();

      // Update the ui-banners setting to enable the banner
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'true';
        value[`banner${ bannerName }`] = value[`banner${ bannerName }`] || {};
        value[`banner${ bannerName }`].text = 'TEST Banner (ui-banners)';
        value[`banner${ bannerName }`].background = '#00ff00';
      });

      HomePagePo.goToAndWaitForGet();

      banner.checkExists();

      banner.text().should('eq', 'TEST Banner (ui-banners)');
      banner.backgroundColor().should('eq', 'rgb(0, 255, 0)');

      // Turn off the banner
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'false';
      });

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();
    });

    it('Should use banner from individual setting', { tags: ['@globalSettings', '@adminUser'] }, () => {
      const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();

      // Set the banner via the individual setting
      updateIndividualBannersSetting(`ui-banner-${ bannerName.toLowerCase() }`, {
        text:       'Test Banner (individual setting)',
        background: '#ff0000'
      });

      HomePagePo.goToAndWaitForGet();

      banner.checkExists();

      banner.text().should('eq', 'Test Banner (individual setting)');
      banner.backgroundColor().should('eq', 'rgb(255, 0, 0)');

      // Unset the individual banner
      updateIndividualBannersSetting(`ui-banner-${ bannerName.toLowerCase() }`);

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();
    });

    it('Should prefer setting from individual setting', { tags: ['@globalSettings', '@adminUser'] }, () => {
      const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();

      // Update the ui-banners setting to enable the banner
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'true';
        value[`banner${ bannerName }`] = value[`banner${ bannerName }`] || {};
        value[`banner${ bannerName }`].text = 'TEST Banner (ui-banners)';
        value[`banner${ bannerName }`].background = '#00ff00';
      });

      HomePagePo.goToAndWaitForGet();

      banner.checkExists();

      banner.text().should('eq', 'TEST Banner (ui-banners)');
      banner.backgroundColor().should('eq', 'rgb(0, 255, 0)');

      // Set the banner via the individual setting
      updateIndividualBannersSetting(`ui-banner-${ bannerName.toLowerCase() }`, {
        text:       'Test Banner (individual setting)',
        background: '#ff0000'
      });

      HomePagePo.goToAndWaitForGet();

      banner.checkExists();

      banner.text().should('eq', 'Test Banner (individual setting)');
      banner.backgroundColor().should('eq', 'rgb(255, 0, 0)');

      // Turn off the banner via the banners setting
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'false';
      });

      HomePagePo.goToAndWaitForGet();

      // Banner should still exist from the individual setting
      banner.checkExists();

      banner.text().should('eq', 'Test Banner (individual setting)');
      banner.backgroundColor().should('eq', 'rgb(255, 0, 0)');

      // Unset the individual banner
      updateIndividualBannersSetting(`ui-banner-${ bannerName.toLowerCase() }`);

      HomePagePo.goToAndWaitForGet();

      banner.checkNotExists();
    });
  }

  describe('Header Banner (Individual Setting)', () => {
    bannerTests('Header');
  });

  describe('Footer Banner (Individual Setting)', () => {
    bannerTests('Footer');
  });

  describe('Login Consent Banner (Individual Setting)', () => {
    before(() => {
      cy.then(() => Cypress.session.clearAllSavedSessions());
      cy.login();

      // Make sure banner is not shown from the ui-banners setting for this banner
      updateBannersSetting((value) => {
        value.showConsent = 'false';
      });

      HomePagePo.goTo();
    });

    it('Should not have banner', { tags: ['@globalSettings', '@adminUser'] }, () => {
      const banner = new FixedBannerPo('#banner-consent');

      cy.logout();
      cy.then(() => Cypress.session.clearAllSavedSessions());

      const loginPage = new LoginPagePo();

      loginPage.goTo();
      loginPage.waitForPage();
      loginPage.submitButton().checkVisible();

      banner.checkNotExists();
    });

    it('Should use banner from individual setting', { tags: ['@globalSettings', '@adminUser'] }, () => {
      cy.then(() => Cypress.session.clearAllSavedSessions());
      cy.login();
      HomePagePo.goTo();

      // Set the banner via the individual setting
      updateIndividualBannersSetting('ui-banner-login-consent', {
        text:       'Test Banner (individual setting)',
        background: '#ff0000'
      });

      cy.logout();
      cy.then(() => Cypress.session.clearAllSavedSessions());

      const loginPage = new LoginPagePo();

      loginPage.goTo();
      loginPage.waitForPage();

      const banner = new FixedBannerPo('#banner-consent');

      banner.checkExists();
      banner.text().should('eq', 'Test Banner (individual setting)');
      banner.backgroundColor().should('eq', 'rgb(255, 0, 0)');

      // Login again, so that we are authenticated to make API requests
      cy.then(() => Cypress.session.clearAllSavedSessions());
      cy.login();
      HomePagePo.goTo();

      // Unset the individual setting
      updateIndividualBannersSetting('ui-banner-login-consent');
    });

    it('Should prefer banner from individual setting ', { tags: ['@globalSettings', '@adminUser'] }, () => {
      cy.then(() => Cypress.session.clearAllSavedSessions());
      cy.login();
      HomePagePo.goTo();

      // Set the banner via the individual setting
      updateIndividualBannersSetting('ui-banner-login-consent', {
        text:       'Test Banner (individual setting)',
        background: '#ff0000'
      });

      const bannerName = 'Consent';

      // Update the ui-banners setting to enable the banner
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'true';
        value[`banner${ bannerName }`] = value[`banner${ bannerName }`] || {};
        value[`banner${ bannerName }`].text = 'TEST Banner (ui-banners)';
        value[`banner${ bannerName }`].background = '#00ff00';
      });

      // Back to the login screen - check the banner is using the individual setting
      cy.logout();
      cy.then(() => Cypress.session.clearAllSavedSessions());

      const loginPage = new LoginPagePo();

      loginPage.goTo();
      loginPage.waitForPage();
      loginPage.submitButton().checkVisible();

      const banner = new FixedBannerPo('#banner-consent');

      banner.checkExists();
      banner.text().should('eq', 'Test Banner (individual setting)');
      banner.backgroundColor().should('eq', 'rgb(255, 0, 0)');

      // Login again, so that we are authenticated to make API requests
      cy.then(() => Cypress.session.clearAllSavedSessions());
      cy.login();
      HomePagePo.goToAndWaitForGet();

      // Unset the individual setting
      updateIndividualBannersSetting('ui-banner-login-consent');

      // Turn off the banner via the banners setting
      updateBannersSetting((value) => {
        value[`show${ bannerName }`] = 'false';
      });

      // Back to the login screen - there should be no banners displayed
      cy.logout();
      cy.then(() => Cypress.session.clearAllSavedSessions());

      loginPage.goTo();
      loginPage.waitForPage();
      loginPage.submitButton().checkVisible();

      banner.checkNotExists();
    });
  });
});
