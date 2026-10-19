import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ReleaseWelcomeDialogPo from '@/cypress/e2e/po/components/release-welcome-dialog.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

const homePage = new HomePagePo();
const dialog = new ReleaseWelcomeDialogPo();
const userMenu = new UserMenuPo();

// A fixed version, whatever the build under test
const mockVersion = (version: string) => cy.intercept('GET', '/rancherversion', {
  statusCode: 200,
  body:       {
    Version:      `v${ version }`,
    GitCommit:    'abc1234',
    RancherPrime: 'false'
  }
});

const feature = (id: string, title: string) => ({
  id, title, description: 'Fetched from the dynamic content endpoint'
});

// An entry for a patch version only: entries match the minor version strictly, so it is never used
const PATCH_DOCUMENT = {
  version:  1,
  releases: [{ version: '2.16.1', whatsNew: [feature('patch', 'Only for 2.16.1')] }]
};

const seedSeenWhatsNew = (seen: string) => {
  cy.setUserPreference({ 'seen-whatsnew': JSON.stringify(seen) });
  cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
    if (req.body?.data?.['seen-whatsnew'] !== JSON.stringify(seen)) {
      req.alias = 'markSeen';
    }
  });
};

let seenWhatsNew: string;

describe('Release welcome', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
    cy.getRancherResource('v1', 'userpreferences').then((resp: Cypress.Response<any>) => {
      seenWhatsNew = resp.body.data[0].data['seen-whatsnew'] ?? '""';
    });
  });

  beforeEach(() => {
    // The modal is marked as read for every other spec, see cypress/support/e2e.ts
    Cypress.env('showReleaseWelcome', true);
    cy.login();

    mockVersion('2.16.0');

    // Use the built-in content, unless a test replaces it through dynamic content
    cy.intercept('GET', '**/first-run', { statusCode: 404 }).as('firstRun');
  });

  afterEach(() => {
    Cypress.env('showReleaseWelcome', false);
  });

  it('welcomes the user once per minor release', () => {
    seedSeenWhatsNew('v2.15.3');

    HomePagePo.goTo();
    dialog.checkVisible();
    dialog.title().should('contain', 'Welcome to');
    dialog.whatsNew().should('be.visible');
    dialog.whatsNewFeatures().should('have.length', 4);
    dialog.cardsSettled();
    dialog.primePromo().scrollIntoView().should('be.visible');
    dialog.primePromo().should('contain', 'Ready for production? Go Prime.');

    cy.wait('@markSeen');

    dialog.goToDashboardButton().click();
    dialog.checkNotExists();

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();
  });

  it('shows the content from dynamic content', () => {
    seedSeenWhatsNew('');
    cy.intercept('GET', '**/first-run', {
      statusCode: 200,
      body:       {
        version:  1,
        releases: [{
          version:  '2.16',
          whatsNew: [{
            id: 'remote', title: 'Updated after the release', description: 'Fetched from the dynamic content endpoint'
          }],
          primePromo: {
            title:       'Prime, updated after the release',
            description: 'Fetched from the dynamic content endpoint',
            products:    ['Remote product'],
            cta:         { action: 'Explore the remote offer', link: 'https://www.suse.com/remote' }
          }
        }]
      }
    }).as('firstRun');

    HomePagePo.goTo();
    cy.wait('@firstRun');
    dialog.checkVisible();
    dialog.whatsNewFeatures().should('have.length', 1);
    dialog.whatsNewFeatures().first().should('have.attr', 'data-testid', 'release-welcome-feature-remote');
    dialog.whatsNewFeatures().first().should('contain', 'Updated after the release');
    dialog.primePromo().should('contain', 'Prime, updated after the release');
    dialog.primePromo().find('li').should('have.length', 1);
    dialog.primePromoExplore().should('have.attr', 'href', 'https://www.suse.com/remote');
    dialog.primePromoExplore().should('contain', 'Explore the remote offer');
    cy.wait('@markSeen');
  });

  it('opens straight away and shows the content once it is loaded', () => {
    seedSeenWhatsNew('');
    cy.intercept('GET', '**/first-run', { statusCode: 404, delay: 2000 }).as('firstRun');

    HomePagePo.goTo();
    dialog.checkVisible();
    dialog.loading().should('be.visible');
    cy.wait('@firstRun');
    dialog.loading().should('not.exist');
    dialog.whatsNewFeatures().should('have.length', 4);
    cy.wait('@markSeen');
  });

  it('uses the built-in content when the document only has an entry for the patch version', () => {
    seedSeenWhatsNew('');
    mockVersion('2.16.1');
    cy.intercept('GET', '**/first-run', { statusCode: 200, body: PATCH_DOCUMENT }).as('firstRun');

    HomePagePo.goTo();
    cy.wait('@firstRun');
    dialog.checkVisible();
    dialog.whatsNewFeatures().should('have.length', 4);
    dialog.whatsNewVersion().should('contain', 'v2.16');
    cy.wait('@markSeen');
  });

  it('does not show again after a patch upgrade', () => {
    seedSeenWhatsNew('2.16');
    mockVersion('2.16.1');

    HomePagePo.goTo();
    homePage.waitForPage();
    cy.wait('@markSeen');
    dialog.checkNotExists();
  });

  it('closes with the close button', () => {
    seedSeenWhatsNew('');

    HomePagePo.goTo();
    dialog.checkVisible();
    cy.wait('@markSeen');

    dialog.closeButton().click();
    dialog.checkNotExists();
  });

  it('can be reopened from the user menu', () => {
    seedSeenWhatsNew('2.16');

    HomePagePo.goTo();
    homePage.waitForPage();
    cy.wait('@markSeen');
    dialog.checkNotExists();

    userMenu.clickMenuItem('What\'s New');
    dialog.checkVisible();

    cy.get('body').type('{esc}');
    dialog.checkNotExists();
  });

  after(() => {
    cy.setUserPreference({ 'seen-whatsnew': seenWhatsNew });
  });
});
