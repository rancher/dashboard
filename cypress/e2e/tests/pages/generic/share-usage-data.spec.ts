import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ShareUsageDataDialogPo from '@/cypress/e2e/po/components/share-usage-data-dialog.po';

const homePage = new HomePagePo();
const dialog = new ShareUsageDataDialogPo();

describe('Share usage data', { tags: ['@generic', '@adminUser'] }, () => {
  beforeEach(() => {
    // The dialog is answered for every other spec, see cypress/support/e2e.ts
    Cypress.env('showShareUsageData', true);
    cy.login();
  });

  afterEach(() => {
    Cypress.env('showShareUsageData', false);
  });

  it('asks an admin once, and requires a choice to continue', () => {
    cy.setUserPreference({ 'share-usage-data': '' });

    HomePagePo.goTo();
    dialog.checkVisible();

    dialog.confirmButton().should('be.disabled');
    dialog.required().should('be.visible');
    dialog.details().should('be.visible');

    // A choice is required, so Escape does not dismiss it
    cy.get('body').type('{esc}');
    dialog.checkVisible();

    dialog.detailsToggle().click();
    dialog.details().should('not.be.visible');

    dialog.options().set(1);
    dialog.required().should('not.exist');
    dialog.confirmButton().should('be.enabled');

    cy.intercept('PUT', 'v1/userpreferences/*').as('saveChoice');
    dialog.confirmButton().click();
    dialog.checkNotExists();

    cy.wait('@saveChoice').then(({ request }) => {
      expect(request.body.data['share-usage-data']).to.eq('"dont-share"');
    });

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();
  });

  it('is not shown once a choice is made', () => {
    cy.setUserPreference({ 'share-usage-data': '"share"' });

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();
  });

  after(() => {
    cy.setUserPreference({ 'share-usage-data': '"dont-share"' });
  });
});
