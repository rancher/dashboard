import { HomeLinksPagePo } from '@/cypress/e2e/po/pages/global-settings/home-links.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

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
    homeLinksPage.applyAndWait('/v1/management.cattle.io.settings/ui-custom-links');

    HomePagePo.goTo();
    homePage.supportLinks().should('have.length', 1).contains('Commercial Support');

    HomeLinksPagePo.navTo();

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

  it('can add and remove custom links', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Note: need to click 'Apply' button twice in this test due to race condition. Test will fail unexpectedly without it.
    const customLinkName = `${ runPrefix }-custom-link`;
    const customLinkUrl = `https://${ runPrefix }/custom/link/url`;

    // Add custom link
    HomeLinksPagePo.navTo();
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
    HomeLinksPagePo.navTo();
    homeLinksPage.removeLinkButton().click();
    homeLinksPage.applyButton().apply();
    homeLinksPage.applyButton().apply();
    cy.wait(['@linksUpdated', '@linksUpdated']);
    homeLinksPage.displayTextInput().checkNotExists();
    homeLinksPage.removeLinkButton().should('not.exist');

    HomePagePo.goTo();
    homePage.supportLinks().contains(customLinkName).should('not.exist');
  });

  it('standard user has only read access to Home Links page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action buttons/checkboxes are hidden for standard user
    HomeLinksPagePo.navTo();
    homeLinksPage.selectCheckbox(0).checkNotExists();
    homeLinksPage.applyButton().checkNotExists();
  });
});
