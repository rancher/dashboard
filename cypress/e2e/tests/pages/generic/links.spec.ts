import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { HomeLinksPagePo } from '@/cypress/e2e/po/pages/global-settings/home-links.po';
import { v1LinksSettingDefaultValue } from '@/cypress/e2e/blueprints/global_settings/home-links-response';

const homePage = new HomePagePo();
const homeLinksSettingsPage = new HomeLinksPagePo();
const APP_CO_LINK = 'https://apps.rancher.io/';
const APP_CO_LABEL = 'SUSE Application Collection';

function interceptVersionAndSetToPrime() {
  return cy.intercept('GET', '/rancherversion', {
    statusCode: 200,
    body:       {
      Version:      '9bf6631da',
      GitCommit:    '9bf6631da',
      RancherPrime: 'true'
    }
  });
}

function resetCustomLinks() {
  cy.getRancherResource('v1', 'management.cattle.io.setting', 'ui-custom-links').then((res) => {
    const obj = {
      ...res.body,
      value: '{}'
    };

    cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-custom-links', JSON.stringify(obj));
  });
}

describe('SUSE Application page and link', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
  });

  describe('link can be hidden via settings', { tags: ['@generic', '@adminUser'] }, () => {
    beforeEach(() => {
      interceptVersionAndSetToPrime().as('rancherVersion');
      resetCustomLinks();
    });

    afterEach(() => {
      resetCustomLinks();
    });

    it('should allow app co link to be hidden', () => {
      HomeLinksPagePo.goTo();
      homeLinksSettingsPage.waitForPage();

      homeLinksSettingsPage.defaultLinkNames().should('have.length', 6);
      homeLinksSettingsPage.checkDefaultLinkName(5, APP_CO_LABEL);
      homeLinksSettingsPage.checkDefaultLinkTargets(5, APP_CO_LINK);

      // Check the checkbox - this will hide the link
      homeLinksSettingsPage.defaultLinkCheckbox(5).then((cb) => {
        cb.checkExists();
        cb.checkVisible();
        cb.isChecked();
        cb.set();
        cb.isUnchecked();
      });

      // Click apply
      homeLinksSettingsPage.applyButton().apply();

      // Check home page no longer shows the collective link
      HomePagePo.navTo();
      homePage.waitForPage();
      homePage.supportLinks().should('have.length', 5);

      // Check the resource that was created and reset it to the default value of {}
      cy.getRancherResource('v1', 'management.cattle.io.setting', 'ui-custom-links').then((res) => {
        const obj = {
          ...res.body,
          value: '{}'
        };

        cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-custom-links', JSON.stringify(obj));
      });
    });

    it('should migrate v1 custom links setting', () => {
      // Set the resource to a v1 value
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'ui-custom-links').then((res) => {
        const obj = {
          ...res.body,
          value: JSON.stringify(v1LinksSettingDefaultValue)
        };

        cy.setRancherResource('v1', 'management.cattle.io.settings', 'ui-custom-links', JSON.stringify(obj));
      });

      HomeLinksPagePo.goTo();
      homeLinksSettingsPage.waitForPage();

      homeLinksSettingsPage.defaultLinkNames().should('have.length', 6);
      homeLinksSettingsPage.checkDefaultLinkName(5, APP_CO_LABEL);
      homeLinksSettingsPage.checkDefaultLinkTargets(5, APP_CO_LINK);

      // Check the checkbox - this will hide the link
      homeLinksSettingsPage.defaultLinkCheckbox(5).then((cb) => {
        cb.checkExists();
        cb.checkVisible();
        cb.isChecked();
        cb.set();
        cb.isUnchecked();
      });

      // Click apply
      homeLinksSettingsPage.applyButton().apply();

      // Check home page no longer shows the collective link
      HomePagePo.navTo();
      homePage.waitForPage();
      homePage.supportLinks().should('have.length', 5);
    });
  });

  // Note: Existing home page test checks that SUSE Collective link is not present
  describe('home page links (prime)', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    beforeEach(() => {
      interceptVersionAndSetToPrime();

      HomePagePo.goTo();
    });

    it('can click on Application Collection link', () => {
      homePage.supportLinks().should('have.length', 6);
      homePage.checkSupportLinkText(5, APP_CO_LABEL);

      homePage.clickSupportLink(5, true);

      cy.url().should('contain', APP_CO_LINK);

      // Check the page title
      cy.title().should('eq', APP_CO_LABEL);
    });
  });
});
