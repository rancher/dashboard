import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ReleaseWelcomeDialogPo from '@/cypress/e2e/po/components/release-welcome-dialog.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

const homePage = new HomePagePo();
const dialog = new ReleaseWelcomeDialogPo();
const userMenu = new UserMenuPo();

describe('Release welcome', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    // The modal is marked as read for every other spec, see cypress/support/e2e.ts
    Cypress.env('showReleaseWelcome', true);
    cy.login();

    // Dev and head builds have no minor version, which never shows the modal
    cy.intercept('GET', '/rancherversion', {
      statusCode: 200,
      body:       {
        Version:      'v2.16.0',
        GitCommit:    'abc1234',
        RancherPrime: 'false'
      }
    });

    // Use the built-in content, unless a test replaces it through dynamic content
    cy.intercept('GET', '**/first-run', { statusCode: 404 }).as('firstRun');
  });

  afterEach(() => {
    Cypress.env('showReleaseWelcome', false);
  });

  it('welcomes the user once per minor release', () => {
    cy.setUserPreference({ 'read-release-welcome': '"2.15"' });
    // Other preferences are saved on load too, wait for the one marking the modal as read
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req.body?.data?.['read-release-welcome'] === '"2.16"') {
        req.alias = 'markRead';
      }
    });

    HomePagePo.goTo();
    dialog.checkVisible();
    dialog.title().should('contain', 'Welcome to');
    dialog.whatsNew().should('be.visible');
    dialog.whatsNewFeatures().should('have.length', 4);
    dialog.primePromo().should('be.visible');

    cy.wait('@markRead');

    dialog.goToDashboardButton().click();
    dialog.checkNotExists();

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();
  });

  it('shows the what\'s new content from dynamic content', () => {
    cy.setUserPreference({ 'read-release-welcome': '""' });
    cy.intercept('GET', '**/first-run', {
      statusCode: 200,
      body:       {
        version:  1,
        releases: [{
          version:  '2.16',
          whatsNew: [{
            id: 'remote', title: 'Updated after the release', description: 'Fetched from the dynamic content endpoint'
          }]
        }]
      }
    }).as('firstRun');

    HomePagePo.goTo();
    cy.wait('@firstRun');
    dialog.checkVisible();
    dialog.whatsNewFeatures().should('have.length', 1);
    dialog.whatsNewFeatures().first().should('have.attr', 'data-testid', 'release-welcome-feature-remote');
    dialog.whatsNewFeatures().first().should('contain', 'Updated after the release');
  });

  it('closes with the close button', () => {
    cy.setUserPreference({ 'read-release-welcome': '""' });

    HomePagePo.goTo();
    dialog.checkVisible();

    dialog.closeButton().click();
    dialog.checkNotExists();
  });

  it('can be reopened from the user menu', () => {
    cy.setUserPreference({ 'read-release-welcome': '"2.16"' });

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();

    userMenu.clickMenuItem('What\'s New');
    dialog.checkVisible();

    cy.get('body').type('{esc}');
    dialog.checkNotExists();
  });

  after(() => {
    cy.setUserPreference({ 'read-release-welcome': '"99.0"' });
  });
});
