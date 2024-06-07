import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FixedBannerPo from '@/cypress/e2e/po/components/fixed-banner.po';
import { makeSetting } from '@/cypress/e2e/blueprints/settings/settings';

function updateBannersSetting(fn) {
  cy.getRancherResource('v1', 'management.cattle.io.settings').then((data: any) => {
    const banners = data.body.data.find((setting) => setting.id === 'ui-banners');
    const value = JSON.parse(banners.value);

    fn(value);

    banners.value = JSON.stringify(value);

    cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-banners', banners);
  });
}

// Common tests for Header and Footer banners
function bannerTests(bannerName: string) {
  it('Should not have banner', () => {
    const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

    HomePagePo.goToAndWaitForGet();

    banner.checkNotExists();
  });

  it('Should use banner from ui-banners setting', () => {
    const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

    HomePagePo.goToAndWaitForGet();

    banner.checkNotExists();

    // Update the ui-banners setting to enable the banner
    updateBannersSetting((value) => {
      value[`show${ bannerName }`] = 'true';
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

  it('Should use banner from individual setting', () => {
    const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

    HomePagePo.goToAndWaitForGet();

    banner.checkNotExists();

    // Set the banner via the individual setting
    const bannerSetting = makeSetting(`ui-banner-${ bannerName.toLowerCase() }`, {
      text:       'Test Banner (individual setting)',
      background: '#ff0000'
    });      

    cy.createRancherResource('v1', 'management.cattle.io.settings', JSON.stringify(bannerSetting));

    HomePagePo.goToAndWaitForGet();

    banner.checkExists();

    banner.text().should('eq', 'Test Banner (individual setting)');
    banner.backgroundColor().should('eq', 'rgb(255, 0, 0)');

    cy.deleteRancherResource('k8s', 'clusters/local/apis/management.cattle.io/v3/settings', `ui-banner-${ bannerName.toLowerCase() }`);

    HomePagePo.goToAndWaitForGet();

    banner.checkNotExists();
  });

  it('Should prefer setting from individual setting', () => {
    const banner = new FixedBannerPo(`#banner-${ bannerName.toLowerCase() }`);

    HomePagePo.goToAndWaitForGet();

    banner.checkNotExists();

    // Update the ui-banners setting to enable the banner
    updateBannersSetting((value) => {
      value[`show${ bannerName }`] = 'true';
      value[`banner${ bannerName }`].text = 'TEST Banner (ui-banners)';
      value[`banner${ bannerName }`].background = '#00ff00';
    });

    HomePagePo.goToAndWaitForGet();

    banner.checkExists();

    banner.text().should('eq', 'TEST Banner (ui-banners)');
    banner.backgroundColor().should('eq', 'rgb(0, 255, 0)');

    // Set the banner via the individual setting
    const bannerSetting = makeSetting(`ui-banner-${ bannerName.toLowerCase() }`, {
      text:       'Test Banner (individual setting)',
      background: '#ff0000'
    });

    cy.createRancherResource('v1', 'management.cattle.io.settings', JSON.stringify(bannerSetting));

    HomePagePo.goToAndWaitForGet();

    banner.checkExists();

    banner.text().should('eq', 'HELLO TEST');
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

    cy.deleteRancherResource('k8s', 'clusters/local/apis/management.cattle.io/v3/settings', `ui-banner-${ bannerName.toLowerCase() }`);

    HomePagePo.goToAndWaitForGet();

    banner.checkNotExists();
  });
}

describe('Banners', { testIsolation: 'off', tags: ['@globalSettings', '@adminUser'] }, () => {

  before(() => {
    cy.login();
  });

  describe('Banner Setting Page', () => {
    it('Can navigate to Banner Settings Page', { tags: ['@globalSettings', '@adminUser', '@standardUser'] }, () => {
      HomePagePo.goTo();

      const burgerMenu = new BurgerMenuPo();
      const productMenu = new ProductNavPo();

      BurgerMenuPo.toggle();

      const globalSettingsNavItem = burgerMenu.links().contains(`Global Settings`);

      globalSettingsNavItem.should('exist');
      globalSettingsNavItem.click();

      const settingsPage = new SettingsPagePo();

      settingsPage.waitForPageWithClusterId();

      const bannersNavItem = productMenu.visibleNavTypes().contains('Banners');

      bannersNavItem.should('exist');
      bannersNavItem.click();

      // Check for title
      cy.get('.main-layout h1').should(($el) => {
        expect($el.text().trim()).equal('Fixed Banners');
      });    
    });
  });

  describe('Header Banner', () => {
    bannerTests('Header');
  });

  describe('Footer Banner', () => {
    bannerTests('Footer');
  });

  describe('Login Banner', () => {

  });
});
