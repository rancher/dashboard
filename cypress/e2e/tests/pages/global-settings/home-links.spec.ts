import { HomeLinksPagePo } from '@/cypress/e2e/po/pages/global-settings/home-links.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { applyCustomLinksResponse, removeCustomLinksResponse } from '@/cypress/e2e/blueprints/global_settings/home-links-response';

const homeLinksPage = new HomeLinksPagePo();
const homePage = new HomePagePo();

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

describe('Home Links', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('can hide or show default links on the Home Page', { tags: ['@globalSettings', '@adminUser'] }, () => {
    HomeLinksPagePo.navTo();

    // Hide all links
    homeLinksPage.selectCheckbox(0).set();
    homeLinksPage.selectCheckbox(1).set();
    homeLinksPage.selectCheckbox(2).set();
    homeLinksPage.selectCheckbox(3).set();
    homeLinksPage.selectCheckbox(4).set();
    homeLinksPage.applyAndWait('/v1/management.cattle.io.settings/ui-custom-links', 200);

    HomePagePo.goTo();
    homePage.supportLinks().should('have.length', 1).contains('Commercial Support');

    HomeLinksPagePo.navTo();

    // Show all links
    homeLinksPage.selectCheckbox(0).set();
    homeLinksPage.selectCheckbox(1).set();
    homeLinksPage.selectCheckbox(2).set();
    homeLinksPage.selectCheckbox(3).set();
    homeLinksPage.selectCheckbox(4).set();
    homeLinksPage.applyAndWait('/v1/management.cattle.io.settings/ui-custom-links', 200);

    HomePagePo.goTo();
    homePage.supportLinks().should('have.length', 6);
  });

  it('can add and remove custom links', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Note: Dynamically stubbing responses here to apply/remove the custom link.
    // Test will fail unexpectedly without stubbing the response due to a race condition
    // where appling/remove custom links does not happen as expected.
    // This is an automation issue only.
    const customLinkName = `${ runPrefix }-custom-link`;
    const customLinkUrl = `https://${ runPrefix }/custom/link/url`;

    // Add custom link
    HomeLinksPagePo.navTo();
    homeLinksPage.addLinkButton().click();
    homeLinksPage.displayTextInput().set(customLinkName);
    homeLinksPage.urlInput().set(customLinkUrl);

    cy.intercept('PUT', '/v1/management.cattle.io.settings/ui-custom-links', applyCustomLinksResponse(customLinkName, customLinkUrl)).as('applyDummyCustomLinks');
    homeLinksPage.applyButton().click();
    cy.wait('@applyDummyCustomLinks');
    HomePagePo.navTo();
    homePage.supportLinks().contains(customLinkName).should('have.attr', 'href', `${ customLinkUrl }`);

    // Remove custom link
    HomeLinksPagePo.navTo();
    homeLinksPage.removeLinkButton().click();
    homeLinksPage.displayTextInput().checkNotExists();
    homeLinksPage.removeLinkButton().should('not.exist');

    cy.intercept('PUT', '/v1/management.cattle.io.settings/ui-custom-links', removeCustomLinksResponse()).as('removeDummyCustomLinks');
    homeLinksPage.applyButton().click();
    cy.wait('@removeDummyCustomLinks');
    HomePagePo.navTo();
    homePage.supportLinks().contains(customLinkName).should('not.exist');
  });

  it('standard user has only read access to Home Links page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action buttons/checkboxes are hidden for standard user
    HomeLinksPagePo.navTo();
    homeLinksPage.selectCheckbox(0).checkNotExists();
    homeLinksPage.applyButton().checkNotExists();
  });
});
