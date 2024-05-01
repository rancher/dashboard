import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.generic.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '~/cypress/support/utils/exception-utils';

const homePage = new HomePagePo();
const homeClusterList = homePage.list();
const provClusterList = new ClusterManagerListPagePo('local');
const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-decription';

const rowDetails = (text) => text.split('\n').map((r) => r.trim()).filter((f) => f);

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

  describe('Home Page', { testIsolation: 'off' }, () => {
    before(() => {
      cy.login();
      HomePagePo.goTo();
    });

    it('Can navigate to release notes page for latest Rancher version', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    /**
     * Verify changelog banner is hidden after clicking link
     * Verify release notes link is valid github page
     * Verify correct Rancher version is displayed
     */

      homePage.restoreAndWait();

      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const rancherVersion = resp.body['value'].split('-', 1)[0].slice(1);

        homePage.changelog().self().contains('Learn more about the improvements and new capabilities in this version.');
        homePage.whatsNewBannerLink().contains(`What's new in ${ rancherVersion }`);

        homePage.whatsNewBannerLink().invoke('attr', 'href').then((releaseNotesUrl) => {
          cy.request(releaseNotesUrl).then((res) => {
            expect(res.status).equals(200);
          });
        });

        homePage.whatsNewBannerLink().click();
        homePage.changelog().self().should('not.exist');
      });
    });

    it('Can navigate to Preferences page', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    /**
     * Click link and verify user lands on preferences page
     */
      const prefPage = new PreferencesPagePo();

      homePage.prefPageLink().click();
      prefPage.waitForPage();
      prefPage.checkIsCurrentPage();
      prefPage.title();
    });

    it('Can restore hidden cards', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
    /**
     * Hide home page banners
     * Click the restore link
     * Verify banners display on home page
     */
      HomePagePo.navTo();
      homePage.restoreAndWait();

      homePage.bannerGraphic().graphicBanner().should('be.visible');
      homePage.bannerGraphic().graphicBannerCloseButton();
      homePage.bannerGraphic().graphicBanner().should('not.exist');

      homePage.getLoginPageBanner().checkVisible();
      homePage.getLoginPageBanner().closeButton();
      homePage.getLoginPageBanner().checkNotExists();

      homePage.restoreAndWait();

      homePage.bannerGraphic().graphicBanner().should('be.visible');
      homePage.getLoginPageBanner().checkVisible();
    });

    it('Can see that cluster details match those in Cluster Manangement page', { tags: ['@adminUser'] }, () => {
    /**
     * Get cluster details from the Home page
     * Verify that the cluster details match those on the Cluster Management page
     */

      const clusterDetails: string[] = [];

      homeClusterList.state('local').invoke('text').then((el) => {
        clusterDetails.push(el.trim());
      });

      homeClusterList.name('local').invoke('text').then((el) => {
        clusterDetails.push(el.trim());
      });

      homeClusterList.version('local').invoke('text').then((el) => {
        clusterDetails.push(rowDetails(el));
      });

      homeClusterList.provider('local').invoke('text').then((el) => {
        clusterDetails.push(rowDetails(el));
      });

      provClusterList.goTo();

      provClusterList.list().state('local').should((el) => {
        expect(el).to.include.text(clusterDetails[0]);
      });

      provClusterList.list().name('local').should((el) => {
        expect(el).to.include.text(clusterDetails[1]);
      });

      provClusterList.list().version('local').should((el) => {
        const version = rowDetails(el.text());

        expect(version[0]).eq(clusterDetails[2][0]);
        expect(version[1]).eq(clusterDetails[2][1]);
      });

      provClusterList.list().provider('local').should((el) => {
        const provider = rowDetails(el.text());

        expect(provider[0]).eq(clusterDetails[3][0]);
        expect(provider[1]).eq(clusterDetails[3][1]);
      });
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

    it('Can filter rows in the cluster list', { tags: ['@generic', '@adminUser'] }, () => {
    /**
     * Filter rows in the cluster list
     */
      HomePagePo.navTo();
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
      const desc = homeClusterList.resourceTable().sortableTable().rowWithName('local').column(1)
        .get('.cluster-description');

      desc.contains(longClusterDescription);
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
      catchTargetPageException('TenantFeatures', 'https://forums.rancher.com');

      // click Forums link
      homePage.clickSupportLink(1, true);

      cy.origin('https://forums.rancher.com', () => {
        cy.url().should('include', 'forums.rancher.com/');
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
});
