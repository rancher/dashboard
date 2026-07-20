import NotificationsCenterPo from '@/cypress/e2e/po/components/notification-center.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/extensions/imported/cluster-import-generic.po';
import { qase } from '@/cypress/support/qase';

const homePage = new HomePagePo();
const homeClusterList = homePage.list();

// Reset the home page card prefs, go the home page and ensure the page is fully loaded
function goToHomePageAndSettle() {
  // Reset the home page cards pref so that everything is shown
  cy.setUserPreference({ 'home-page-cards': '{}' });
  cy.intercept('GET', '/v1/management.cattle.io.clusters?*', {
    statusCode: 200,
    body:       {
      count: 0,
      data:  [],
    },
  }).as('fetchClustersHomePage');

  // Go to the home page
  HomePagePo.goToAndWaitForGet();
  homePage.waitForPage();

  // Wait for the page to settle - filter the cluster list ensures table is ready and page is ready
  cy.wait('@fetchClustersHomePage');

  // Wait for the cluster table to load and filter so there are no rows
  homeClusterList.resourceTable().sortableTable().filter('random text', 200);
  homeClusterList.resourceTable().sortableTable().rowElements().should((el) => expect(el).to.contain.text('There are no rows which match your search query.'));
}

// Prime shows an extra notification vs Community
// Min items: Community 1, Prime 2. Count can be higher (dynamic new-release applies to Community and Prime).
function assertHomeNotificationCount(nc: NotificationsCenterPo) {
  cy.getRancherVersion().then((version) => {
    const minCount = version.RancherPrime === 'true' ? 2 : 1;

    nc.checkCountAtLeast(minCount);
  });
}

describe('Home Page', { testIsolation: false }, () => {
  before(() => {
    cy.login();
  });

  qase(9690, it('has notification for release notes', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    cy.setUserPreference({ 'read-whatsnew': '' });

    goToHomePageAndSettle();

    // Notification centre should have one unread notification for the release notes
    const nc = homePage.notificationsCenter();

    // Open the notification centre
    nc.toggle();

    nc.checkOpen();

    nc.checkExists();
    nc.checkVisible();
    nc.checkHasUnread();

    assertHomeNotificationCount(nc);

    // Get the release notes notification - this is the first one on Community builds, second on Prime builds
    let item = nc.getNotificationByName('release-notes');

    item.checkExists();

    cy.intercept('PUT', 'v1/userpreferences/*').as('markReleaseNotesRead');

    // Mark all as read
    nc.markAllRead();

    nc.checkAllRead();

    // Close
    nc.toggle();

    cy.wait(['@markReleaseNotesRead']);

    nc.checkClosed();

    // Open again
    nc.toggle();

    nc.checkOpen();

    nc.checkExists();
    nc.checkVisible();
    assertHomeNotificationCount(nc);
    nc.checkAllRead();

    // Now mark the notification as unread
    item = nc.getNotificationByName('release-notes');

    item.title().should('contain', `Welcome to Rancher v`);
    item.primaryActionButton().should('exist');

    item.checkRead();
    item.toggleRead();
    item.checkUnread();
    nc.checkHasUnread();
  }));

  qase(7009, it('Can toggle banner graphic', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    goToHomePageAndSettle();

    // Banner graphic should be visible
    homePage.bannerGraphic().graphicBanner().should('exist');
    homePage.bannerGraphic().graphicBanner().should('be.visible');

    // Hide the main banner graphic
    homePage.toggleBanner();

    // Banner graphic should be hidden
    homePage.bannerGraphic().graphicBanner().should('not.exist');

    // Show the banner graphic
    homePage.toggleBanner();
    homePage.bannerGraphic().graphicBanner().should('exist');
  }));

  qase(8910, it('Can navigate to Home page', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    HomePagePo.navTo();
    homePage.waitForPage();
  }));

  qase(1427, it('Can use the Manage, Import Existing, and Create buttons', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    /**
     * Click 'Manage' button and verify user lands on the Cluster Management page
     * Click on the Import Existing button and verify user lands on the cluster creation page in import mode
     * Click on the Create button and verify user lands on the cluster creation page
     */
    const clusterManagerPage = new ClusterManagerListPagePo('_');
    const genericCreateClusterPage = new ClusterManagerImportGenericPagePo('_');

    HomePagePo.navTo();
    homePage.manageButton().click();
    clusterManagerPage.waitForPage();

    HomePagePo.goToAndWaitForGet();
    homePage.importExistingButton().click();
    genericCreateClusterPage.waitForPage('mode=import');

    HomePagePo.goToAndWaitForGet();
    homePage.createButton().click();
    genericCreateClusterPage.waitForPage();
  }));

  qase(2059, it('Can navigate to release notes page for latest Rancher version', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    cy.setUserPreference({ 'read-whatsnew': '' });
    HomePagePo.navTo();
    homePage.waitForPage();

    const nc = homePage.notificationsCenter();

    // Open the notification centre
    nc.toggle();

    nc.checkOpen();
    nc.checkExists();
    nc.checkVisible();
    assertHomeNotificationCount(nc);

    const item = nc.getNotificationByName('release-notes');

    item.checkExists();

    cy.getRancherVersion().then((version) => {
      cy.window().then((win) => {
        cy.stub(win, 'open', () => {}).as('openReleaseNotes');
      });

      item.primaryActionButton().click();

      cy.get('@openReleaseNotes').should((stub: any) => {
        const [url, target] = stub.getCall(0).args;

        expect(url).to.contain(version.RancherPrime === 'true' ? 'documentation.suse.com/cloudnative/rancher-manager' : 'github.com/rancher/rancher/releases');
        expect(target).to.eq('_blank');
      });
    });
  }));

  after(() => {
    // Clear any banner hiding preferences - needed incase of 'Can toggle banner graphic' test failure
    cy.setUserPreference({ 'home-page-cards': '{}' });
  });
});
