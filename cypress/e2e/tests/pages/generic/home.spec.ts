import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/extensions/imported/cluster-import-generic.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';
import { generateClustersDataSmall } from '@/cypress/e2e/blueprints/clusters/clusters-get';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { generateMockClusterDataAndIntercepts } from '~/cypress/e2e/blueprints/clusters/fake-clusters-multi';

const homePage = new HomePagePo();
const homeClusterList = homePage.list();
const localCluster = 'local';
const provClusterList = new ClusterManagerListPagePo(localCluster);
const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-description';

// Reset the home page card prefs, go the home page and ensure the page is fully loaded
function goToHomePageAndSettle() {
  // Reset the home page cards pref so that everything is shown
  cy.setUserPreference({ 'home-page-cards': '{}' });

  cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?exclude=metadata.managedFields', {
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
  homeClusterList.resourceTable().sortableTable().filter('random text');
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

  describe('List', { testIsolation: 'off', tags: ['@vai', '@generic', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      // Set table to show 10 rows per page
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');
    });

    describe('Does not require intercepts', () => {
      it('Can see that cluster details match those in Cluster Manangement page', () => {
      /**
       * Get cluster details from the Home page
       * Verify that the cluster details match those on the Cluster Management page
       */
        HomePagePo.navTo();
        homePage.waitForPage();

        homeClusterList.version(localCluster).invoke('text').should('not.contain', '—');
        homeClusterList.state(localCluster).invoke('text').as('stateText');
        homeClusterList.name(localCluster).invoke('text').as('nameText');
        homeClusterList.version(localCluster).invoke('text').as('versionText');
        homeClusterList.provider(localCluster).invoke('text').as('providerText');

        provClusterList.goTo();
        provClusterList.waitForPage();

        cy.get('@stateText').then((state) => {
          provClusterList.list().details(localCluster, 1).should('contain.text', state);
        });

        cy.get('@nameText').then((name) => {
          provClusterList.list().details(localCluster, 2).should('contain.text', name);
        });

        cy.get('@versionText').then((version) => {
          provClusterList.list().details(localCluster, 3).should('contain.text', version);
        });

        cy.get('@providerText').then((provider) => {
          provClusterList.list().details(localCluster, 4).should('contain.text', provider);
        });
      });

      it('Can filter rows in the cluster list', () => {
      /**
       * Filter rows in the cluster list
       */
        HomePagePo.navTo();
        homePage.waitForPage();

        homeClusterList.resourceTable().sortableTable().filter('random text');
        homeClusterList.resourceTable().sortableTable().rowElements().should((el) => {
          expect(el).to.contain.text('There are no rows which match your search query.');
        });

        homeClusterList.resourceTable().sortableTable().filter(localCluster);
        homeClusterList.name(localCluster).should((el) => {
          expect(el).to.contain.text(localCluster);
        });
      });

      it('Should show cluster description information in the cluster list', () => {
      // since I wasn't able to fully mock a list of clusters
      // the next best thing is to add a description to the current local cluster
      // testing https://github.com/rancher/dashboard/issues/10441
        cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`, (req) => {
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

        const desc = homeClusterList.resourceTable().sortableTable().rowWithName(localCluster).column(1)
          .get('.cluster-description');

        desc.contains(longClusterDescription);
      });

      it('check table headers are visible', () => {
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

    describe('Requires intercepts', () => {
      const clusterCount = 102;
      const clusterData: { provId: string; mgmtId: string }[] = [];

      beforeEach('set up', () => {
        // Define the states we want to cycle through
        const states = ['active', 'pending', 'error', 'updating', 'provisioning'];
        const kubernetesVersions = ['v1.27.10+rke2r1', 'v1.27.10+rke2r2', 'v1.27.10+rke2r3', 'v1.27.10+rke2r4', 'v1.27.10+rke2r5'];
        // Generate multiple fake clusters with different states
        const clusters = Array.from({ length: clusterCount - 1 }, (_, i) => ({
          provId:            `fake-cluster-${ i }`,
          mgmtId:            `fake-mgmt-${ i }`,
          state:             states[i % states.length],
          kubernetesVersion: kubernetesVersions[i % kubernetesVersions.length]
        }));

        clusterData.push(...clusters);

        // Set up intercepts for all clusters at once
        generateMockClusterDataAndIntercepts(clusters);
      });

      it('pagination is visible and user is able to navigate through clusters data', () => {
        HomePagePo.goToAndWaitForGet();
        homePage.waitForPage();

        // pagination is visible
        homeClusterList.resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        homeClusterList.resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        homeClusterList.resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        homeClusterList.resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        homeClusterList.resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        homeClusterList.resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ clusterCount } Clusters`);
          });

        // navigate to next page - right button
        homeClusterList.resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        homeClusterList.resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ clusterCount } Clusters`);
          });
        homeClusterList.resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        homeClusterList.resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        homeClusterList.resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        homeClusterList.resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ clusterCount } Clusters`);
          });
        homeClusterList.resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        homeClusterList.resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        homeClusterList.resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = clusterCount % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        homeClusterList.resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ clusterCount - (lastPageCount) + 1 } - ${ clusterCount } of ${ clusterCount } Clusters`);
          });
      });

      it('sorting changes the order of paginated clusters data', () => {
        HomePagePo.goToAndWaitForGet();
        homePage.waitForPage();

        // check table is sorted by name in ASC order by default
        homeClusterList.resourceTable().sortableTable().tableHeaderRow()
          .checkSortOrder(1, 'down');

        // first cluster name should be visible on first page (sorted in ASC order)
        homeClusterList.resourceTable().sortableTable().rowElementWithName('fake-cluster-0')
          .scrollIntoView()
          .should('be.visible');

        // sort by name in DESC order
        homeClusterList.resourceTable().sortableTable().sort(1)
          .click({ force: true });
        homeClusterList.resourceTable().sortableTable().tableHeaderRow()
          .checkSortOrder(1, 'up');

        // first cluster name should be NOT visible on first page (sorted in DESC order)
        homeClusterList.resourceTable().sortableTable().rowElementWithName('fake-cluster-0')
          .should('not.exist');

        // navigate to last page
        homeClusterList.resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // first cluster name should be visible on last page (sorted in DESC order)
        homeClusterList.resourceTable().sortableTable().rowElementWithName('fake-cluster-0')
          .scrollIntoView()
          .should('be.visible');
      });

      it('filter clusters', () => {
        HomePagePo.goToAndWaitForGet();
        homePage.waitForPage();

        homeClusterList.resourceTable().sortableTable().checkVisible();
        homeClusterList.resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
        homeClusterList.resourceTable().sortableTable().checkRowCount(false, 10);

        // filter by name
        const firstClusterName = 'fake-cluster-0';

        homeClusterList.resourceTable().sortableTable().filter(firstClusterName).then(() => {
          homeClusterList.resourceTable().sortableTable().checkRowCount(false, 1);
          homeClusterList.resourceTable().sortableTable().rowElementWithName(firstClusterName)
            .should('be.visible');
        });

        // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13823
        // filter by provider
        // const provider = DigitalOcean

        // homeClusterList.resourceTable().sortableTable().filter(provider);
        // homeClusterList.resourceTable().sortableTable().checkRowCount(false, 10);

        // filter by Kubernetes version
        const kubernetesVersion = 'v1.27.10+rke2r1';

        homeClusterList.resourceTable().sortableTable().filter(kubernetesVersion).then(() => {
          homeClusterList.resourceTable().sortableTable().checkRowCount(false, 10);
          homeClusterList.resourceTable().sortableTable().rowElementWithName(firstClusterName)
            .should('be.visible');

          // check count after filter
          homeClusterList.resourceTable().sortableTable().pagination()
            .paginationText()
            .should((el) => {
              expect(el.trim()).to.eq(`1 - 10 of 21 Clusters`);
            });
        });

        // filter by Status
        homeClusterList.resourceTable().sortableTable().filter('Active').then(() => {
          homeClusterList.resourceTable().sortableTable().checkRowCount(false, 10);
          homeClusterList.resourceTable().sortableTable().rowElementWithName(firstClusterName)
            .should('be.visible');

          // check count after filter
          homeClusterList.resourceTable().sortableTable().pagination()
            .paginationText()
            .should((el) => {
              expect(el.trim()).to.eq(`1 - 10 of 22 Clusters`);
            });

          homeClusterList.resourceTable().sortableTable().rowNames('.list-cluster-name').then((rows) => {
            rows.forEach((row) => {
              homeClusterList.resourceTable().resourceTableDetails(row, 0).contains('Active', MEDIUM_TIMEOUT_OPT);
            });
          });
          homeClusterList.resourceTable().sortableTable().checkRowCount(false, 10);
        });
      });

      it('pagination is hidden', () => {
      // Generate small set of clusters data
        generateClustersDataSmall();
        HomePagePo.goToAndWaitForGet();
        cy.wait('@clustersDataSmall');
        homePage.waitForPage();

        homeClusterList.resourceTable().sortableTable().checkVisible();
        homeClusterList.resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
        homeClusterList.resourceTable().sortableTable().checkRowCount(false, 1);
        homeClusterList.resourceTable().sortableTable().pagination()
          .checkNotExists();
      });
    });

    after('clean up', () => {
      // Reset to default rows per page
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');
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

    it('Validate home page with percy', { tags: ['@generic', '@adminUser'] }, () => {
      // Navigate to home page and wait for page to be fully loaded.
      HomePagePo.goToAndWaitForGet();

      // #takes percy snapshot.
      cy.percySnapshot('Home Page');
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

      // Banner graphic should be visible
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
});
