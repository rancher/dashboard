import { CURRENT_RANCHER_VERSION } from '@shell/config/version.js';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/extensions/imported/cluster-import-generic.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '~/cypress/support/utils/exception-utils';

const homePage = new HomePagePo();
const homeClusterList = homePage.list();
const provClusterList = new ClusterManagerListPagePo('local');
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

  describe('List', { testIsolation: 'off' }, () => {
    before(() => {
      cy.login();
    });

    it('Can see that cluster details match those in Cluster Manangement page', { tags: ['@generic', '@adminUser'] }, () => {
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

      const desc = homeClusterList.resourceTable().sortableTable().rowWithName('local').column(1)
        .get('.cluster-description');

      desc.contains(longClusterDescription);
    });

    it('check table headers are visible', { tags: ['@vai', '@generic', '@adminUser'] }, () => {
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

    it('Can navigate to Preferences page', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    /**
     * Click link and verify user lands on preferences page
     */

      HomePagePo.navTo();
      homePage.waitForPage();
      const prefPage = new PreferencesPagePo();

      homePage.prefPageLink().click();
      prefPage.waitForPage();
      prefPage.checkIsCurrentPage();
      prefPage.title();
    });

    it('Can restore hidden cards', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
      goToHomePageAndSettle();

      // Banner graphic and the login banner should be visible
      homePage.bannerGraphic().graphicBanner().should('exist');
      homePage.bannerGraphic().graphicBanner().should('be.visible');
      homePage.getLoginPageBanner().checkVisible();

      // Close the banner for changing login view
      homePage.getLoginPageBanner().closeButton();
      homePage.getLoginPageBanner().checkNotExists();

      // Restore the cards should bring back the login banner
      homePage.restoreAndWait();

      // Check login banner is visible
      homePage.getLoginPageBanner().checkVisible();
    });

    it('Can toggle banner graphic', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
      goToHomePageAndSettle();

      // Banner graphic and the login banner should be visible
      homePage.bannerGraphic().graphicBanner().should('exist');
      homePage.bannerGraphic().graphicBanner().should('be.visible');

      // Hide the main banner graphic
      homePage.toggleBanner();

      // Banner graphic and the login banner should be visible
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

    // Note: This must be the last test to run in this test suite.
    // When the test clicks on a link that opens a new tab it causes failures in tests that run after it.
    it('Can navigate to release notes page for latest Rancher version', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
      /**
       * Verify changelog banner is hidden after clicking link
       * Verify release notes link is valid github page
       * Verify correct Rancher version is displayed
       */
      HomePagePo.navTo();
      homePage.waitForPage();
      homePage.restoreAndWait();

      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        homePage.changelog().self().contains(`Learn more about the improvements and new capabilities in ${ CURRENT_RANCHER_VERSION }`);
        homePage.whatsNewBannerLink().contains(`What's new in ${ CURRENT_RANCHER_VERSION }`);

        homePage.whatsNewBannerLink().invoke('attr', 'href').then((releaseNotesUrl) => {
          cy.request(releaseNotesUrl).then((res) => {
            expect(res.status).equals(200);
          });
        });

        homePage.whatsNewBannerLink().click();
        homePage.changelog().self().should('not.exist');
      });
    });
  });
});
