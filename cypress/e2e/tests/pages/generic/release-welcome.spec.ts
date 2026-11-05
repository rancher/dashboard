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

const seedReadWhatsNew = (read: string) => {
  cy.setUserPreference({ 'read-whatsnew': JSON.stringify(read) });
  cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
    if (req.body?.data?.['read-whatsnew'] !== JSON.stringify(read)) {
      req.alias = 'markRead';
    }
  });
};

let readWhatsNew: string;

describe('Release welcome', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
    cy.getRancherResource('v1', 'userpreferences').then((resp: Cypress.Response<any>) => {
      readWhatsNew = resp.body.data[0].data['read-whatsnew'] ?? '""';
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
    seedReadWhatsNew('v2.15.3');

    HomePagePo.goTo();
    dialog.checkVisible();
    dialog.title().should('contain', 'Welcome to');
    dialog.whatsNew().should('be.visible');
    dialog.whatsNewFeatures().should('have.length', 4);
    dialog.cardsSettled();
    dialog.primePromo().scrollIntoView().should('be.visible');
    dialog.primePromo().should('contain', 'Ready for production? Go Prime.');

    dialog.closeButton().click();
    dialog.checkNotExists();
    // Read like the release notes notification: the running version, without the build suffix
    cy.wait('@markRead').its('request.body.data.read-whatsnew').should('eq', '"v2.16.0"');

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();

    const nc = homePage.notificationsCenter();

    nc.toggle();
    nc.getNotificationByName('release-notes').checkRead();
  });

  it('shows the content from dynamic content', () => {
    seedReadWhatsNew('');
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

    dialog.closeButton().click();
    cy.wait('@markRead');
  });

  it('opens straight away and shows the content once it is loaded', () => {
    seedReadWhatsNew('');
    cy.intercept('GET', '**/first-run', { statusCode: 404, delay: 2000 }).as('firstRun');

    HomePagePo.goTo();
    dialog.checkVisible();
    dialog.loading().should('be.visible');
    cy.wait('@firstRun');
    dialog.loading().should('not.exist');
    dialog.whatsNewFeatures().should('have.length', 4);

    dialog.closeButton().click();
    cy.wait('@markRead');
  });

  it('uses the built-in content when the document only has an entry for the patch version', () => {
    seedReadWhatsNew('');
    mockVersion('2.16.1');
    cy.intercept('GET', '**/first-run', { statusCode: 200, body: PATCH_DOCUMENT }).as('firstRun');

    HomePagePo.goTo();
    cy.wait('@firstRun');
    dialog.checkVisible();
    dialog.whatsNewFeatures().should('have.length', 4);
    dialog.whatsNewVersion().should('contain', '2.16').and('not.contain', 'v').and('not.contain', '2.16.1');

    dialog.closeButton().click();
    cy.wait('@markRead');
  });

  it('does not show again after a patch upgrade, the release notes notification does', () => {
    seedReadWhatsNew('v2.16.0');
    mockVersion('2.16.1');

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();

    const nc = homePage.notificationsCenter();

    nc.toggle();
    nc.getNotificationByName('release-notes').checkUnread();
  });

  it('opens with the focus on the close button, and closes with it', () => {
    seedReadWhatsNew('');

    HomePagePo.goTo();
    dialog.checkVisible();
    dialog.closeButton().should('have.focus');

    dialog.closeButton().click();
    dialog.checkNotExists();
    cy.wait('@markRead');
  });

  it('shows again on a reload until it is closed', () => {
    seedReadWhatsNew('v2.15.3');

    HomePagePo.goTo();
    dialog.checkVisible();

    cy.reload();
    dialog.checkVisible();

    dialog.closeButton().click();
    dialog.checkNotExists();
    cy.wait('@markRead');

    cy.reload();
    homePage.waitForPage();
    dialog.checkNotExists();
  });

  it('can be reopened from the user menu', () => {
    seedReadWhatsNew('v2.16.0');

    HomePagePo.goTo();
    homePage.waitForPage();
    dialog.checkNotExists();

    userMenu.clickMenuItem('What\'s New');
    dialog.checkVisible();
    dialog.closeButton().should('have.focus');

    cy.get('body').type('{esc}');
    dialog.checkNotExists();
  });

  after(() => {
    cy.setUserPreference({ 'read-whatsnew': readWhatsNew });
  });
});
