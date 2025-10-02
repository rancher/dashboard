import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/extensions/imported/cluster-import-generic.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';

const homePage = new HomePagePo();
const homeClusterList = homePage.list();
const provClusterList = new ClusterManagerListPagePo('local');
const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-description';

// Reset the home page card prefs, go the home page and ensure the page is fully loaded
function goToHomePageAndSettle() {
  // Reset the home page cards pref so that everything is shown
  cy.setUserPreference({ 'home-page-cards': '{}' });
  cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*', {
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

describe('Home Page', () => {
  it('Confirm correct number of settings requests made', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    cy.login();

    cy.intercept('GET', '/v1/management.cattle.io.settings?exclude=metadata.managedFields').as('settingsReq');

    homePage.goTo();

    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response.body.count).greaterThan(PARTIAL_SETTING_THRESHOLD);
    });
    // Yes this is bad, but want to ensure no other settings requests are made.
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get('@settingsReq.all').should('have.length', 1);
  });

  describe('List', { testIsolation: 'off' }, () => {
    before(() => {
      cy.login();
    });

    it('Validate home page with percy', { tags: ['@generic', '@adminUser'] }, () => {
      // Navigate to home page and wait for page to be fully loaded.
      HomePagePo.goToAndWaitForGet();

      // #takes percy snapshot.
      cy.percySnapshot('Home Page');
    });

    it('Can see that cluster details match those in Cluster Management page', { tags: ['@generic', '@adminUser'] }, () => {
      /**
       * Get cluster details from the Home page
       * Verify that the cluster details match those on the Cluster Management page
       */
      const clusterName = 'local';

      HomePagePo.navTo();
      homePage.waitForPage();

      homeClusterList.version(clusterName).invoke('text').should('not.contain', '—');
      homeClusterList.state(clusterName).invoke('text').as('stateText');
      homeClusterList.name(clusterName).invoke('text').as('nameText');
      homeClusterList.version(clusterName).invoke('text').as('versionText');
      homeClusterList.provider(clusterName).invoke('text').as('providerText');

      provClusterList.goTo();
      provClusterList.waitForPage();

      cy.get('@stateText').then((state) => {
        provClusterList.list().details(clusterName, 1).should('contain.text', state);
      });

      cy.get('@nameText').then((name) => {
        provClusterList.list().details(clusterName, 2).should('contain.text', name);
      });

      cy.get('@versionText').then((version) => {
        provClusterList.list().details(clusterName, 3).should('contain.text', version);
      });

      cy.get('@providerText').then((provider) => {
        provClusterList.list().details(clusterName, 4).should('contain.text', provider);
      });
    });

    it('Can filter rows in the cluster list', { tags: ['@generic', '@adminUser'] }, () => {
      /**
       * Filter rows in the cluster list
       */
      HomePagePo.navTo();
      homePage.waitForPage();

      homeClusterList.resourceTable().sortableTable().filter('random text');
      homeClusterList.resourceTable().sortableTable().rowElements().should((el) => {
        expect(el).to.contain.text('There are no rows which match your search query.');
      });

      homeClusterList.resourceTable().sortableTable().filter('local');
      homeClusterList.name('local').should((el) => {
        expect(el).to.contain.text('local');
      });
    });

    it('Should show cluster description information in the cluster list', { tags: ['@generic', '@adminUser'] }, () => {
      // since I wasn't able to fully mock a list of clusters
      // the next best thing is to add a description to the current local cluster
      // testing https://github.com/rancher/dashboard/issues/10441

      const homePageWithLocalPagination = '/v1/provisioning.cattle.io.clusters?*';

      // Why the long intercept url?
      // There are two requests to fetch clusters (side nav + cluster list). In theory "cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`" should intercept them both
      // how is not, only the first one for the side nav, and not the second for the list.
      // const homePageWithSSP = `/v1/provisioning.cattle.io.clusters?page=1&pagesize=100&sort=metadata.annotations[provisioning.cattle.io/management-cluster-display-name]&filter=metadata.labels[provider.cattle.io]!=harvester&filter=status.provider!=harvester&exclude=metadata.managedFields`;

      cy.intercept('GET', homePageWithLocalPagination, (req) => {
        req.continue((res) => {
          const localIndex = res.body.data.findIndex((item) => item.id.includes('/local'));

          if (localIndex >= 0) {
            res.body.data[localIndex].metadata.annotations['field.cattle.io/description'] = longClusterDescription;
          }

          res.send(res.body);
        });
      }).as('provClusters');

      homePage.goTo();
      homePage.waitForPage();

      const desc = homeClusterList.resourceTable().sortableTable().rowWithName('local').column(1)
        .get('.cluster-description');

      desc.contains(longClusterDescription);
    });

    it('check table headers are visible', { tags: ['@noVai', '@generic', '@adminUser'] }, () => {
      homePage.goTo();
      homePage.waitForPage();

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Provider Distro', 'Kubernetes Version Architecture', 'CPU', 'Memory', 'Pods'];

      homePage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          const text = el.text().trim().split('\n').map((r) => r.trim())
            .join(' ');

          expect(text).to.eq(expectedHeaders[i]);
        });
    });
  });

  describe('Support Links', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    // Click the support links and verify user lands on the correct page
    beforeEach(() => {
      cy.login();
      HomePagePo.goTo();
    });

    it('can click on Docs link', () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://ranchermanager.docs.rancher.com');

      homePage.supportLinks().should('have.length', 6);
      homePage.clickSupportLink(0, true);

      cy.origin('https://ranchermanager.docs.rancher.com', () => {
        cy.url().should('include', 'ranchermanager.docs.rancher.com');
      });
    });

    it('can click on Forums link', () => {
      catchTargetPageException('TenantFeatures', 'https://forums.suse.com');

      // click Forums link
      homePage.clickSupportLink(1, true);

      cy.origin('https://forums.suse.com', () => {
        cy.url().should('include', 'forums.suse.com/');
      });
    });

    it('can click on Slack link', () => {
      // click Slack link
      homePage.clickSupportLink(2, true);

      cy.origin('https://slack.rancher.io', () => {
        cy.url().should('include', 'slack.rancher.io/');
      });
    });

    it('can click on File an Issue link', () => {
      // click File an Issue link
      homePage.clickSupportLink(3, true);

      cy.origin('https://github.com', () => {
        cy.url().should('include', 'github.com/login');
      });
    });

    it('can click on Get Started link', () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

      // click Get Started link
      homePage.clickSupportLink(4, true);

      cy.url().should('include', 'getting-started/overview');
    });

    it('can click on Commercial Support link', () => {
      // click Commercial Support link
      homePage.clickSupportLink(5);

      cy.url().should('include', '/support');
    });
  });

  describe('Home Page', { testIsolation: 'off' }, () => {
    before(() => {
      cy.login();
    });

    it('Can navigate to Home page', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
      HomePagePo.navTo();
      homePage.waitForPage();
    });

    it('has notification for release notes', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
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
      nc.checkCount(1);

      // Get the release notes notification - this is the first (and only) one
      let item = nc.getNotificationByIndex(0);

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
      nc.checkCount(1);
      nc.checkAllRead();

      // Now mark the notification as unread
      item = nc.getNotificationByIndex(0);

      item.title().should('contain', `Welcome to Rancher v`);
      item.primaryActionButton().should('exist');

      item.checkRead();
      item.toggleRead();
      item.checkUnread();
      nc.checkHasUnread();
    });

    it('Can toggle banner graphic', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
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
    });

    it('Can use the Manage, Import Existing, and Create buttons', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
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
    });

    it('Can navigate to release notes page for latest Rancher version', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
      cy.setUserPreference({ 'read-whatsnew': '' });
      HomePagePo.navTo();
      homePage.waitForPage();

      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const nc = homePage.notificationsCenter();

        // Open the notification centre
        nc.toggle();

        nc.checkOpen();
        nc.checkExists();
        nc.checkVisible();
        nc.checkCount(1);

        // Get the release notes notification
        const item = nc.getNotificationByIndex(0);

        item.checkExists();

        cy.window().then((win) => {
          cy.stub(win, 'open', () => {}).as('openReleaseNotes');
        });

        item.primaryActionButton().click();

        cy.get('@openReleaseNotes').should('be.calledWith', 'https://github.com/rancher/rancher/releases/latest', '_blank');
      });
    });
  });

  after(() => {
    // Clear any banner hiding preferences - needed incase of 'Can toggle banner graphic' test failure
    cy.setUserPreference({ 'home-page-cards': '{}' });
  });
});
