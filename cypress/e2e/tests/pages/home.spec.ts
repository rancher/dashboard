import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import ClusterManagerListPagePo from '~/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportGenericPagePo from '~/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.generic.po';
import WhatsNewPagePo from '~/cypress/e2e/po/pages/docs/whats-new.po';
import BannerGraphicPo from '~/cypress/e2e/po/components/banner-graphic.po';
import BannersPo from '~/cypress/e2e/po/components/banners.po';
import SortableTablePo from '~/cypress/e2e/po/components/sortable-table.po';

const homePage = new HomePagePo();
const homeClusterList = homePage.list();
const provClusterList = new ClusterManagerListPagePo('local');
const whatsNewPage = new WhatsNewPagePo();
const bannerGraphic = new BannerGraphicPo();
const banners = new BannersPo();
const sortableTable = new SortableTablePo('.dashboard-root');

describe('User can perform actions on the Home Page', () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goToAndWaitForGet();
  });

  it('Can navigate to What\'s new page', () => {
    /**
     * Click link on home page and verify user lands on What's new page
     * Verify contents of What's new page
     * Verify changlog banner is hidden after navigating to the page
     */
    const burgerMenuPo = new BurgerMenuPo();
    const text: string[] = [];

    homePage.restoreAndWait();

    banners.changelog().find('a').invoke('text').then((el) => {
      text.push(el);
    });

    banners.changelog().invoke('text').then((el) => {
      expect(el).contains(text[0]);
    });

    banners.changelog().find('a').click();
    whatsNewPage.waitForPage();
    whatsNewPage.title().invoke('text').then((el: string) => {
      expect(el.toLowerCase()).contains(text[0].toLowerCase());
    });

    BurgerMenuPo.toggle();
    burgerMenuPo.home().click();
    banners.changelog().should('not.exist');
  });

  it('Can navigate to Preferences page', () => {
    /**
     * Click link and verify user lands on preferences page
     */
    const prefPage = new PreferencesPagePo();

    homePage.prefPageLink().click();
    prefPage.waitForPage();
    prefPage.checkIsCurrentPage();
    prefPage.title();
  });

  it('Can restore hidden cards', () => {
    /**
     * Hide home page banners
     * Click the restore link
     * Verify banners display on home page
     */

    homePage.restoreAndWait();

    bannerGraphic.graphicBanner().should('be.visible');
    bannerGraphic.graphicBannerCloseButton();
    bannerGraphic.graphicBanner().should('not.exist');

    banners.setLoginPageBanner().should('be.visible');
    banners.closeButton();
    banners.setLoginPageBanner().should('not.exist');

    homePage.restoreAndWait();

    bannerGraphic.graphicBanner().should('be.visible');
    banners.setLoginPageBanner().should('be.visible');
  });

  it('Can see that cluster details match those in Cluster Manangement page', () => {
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
      clusterDetails.push(el.trim());
    });

    homeClusterList.provider('local').invoke('text').then((el) => {
      clusterDetails.push(el.trim());
    });

    provClusterList.goTo();

    provClusterList.list().state('local').should((el) => {
      expect(el).to.include.text(clusterDetails[0]);
    });

    provClusterList.list().name('local').should((el) => {
      expect(el).to.include.text(clusterDetails[1]);
    });

    provClusterList.list().version('local').should((el) => {
      expect(el).to.include.text(clusterDetails[2]);
    });

    provClusterList.list().provider('local').should((el) => {
      expect(el).to.include.text(clusterDetails[3]);
    });
  });

  it('Can use the Manage, Import Existing, and Create buttons', () => {
    /**
     * Click 'Manage' button and verify user lands on the Cluster Management page
     * Click on the Import Existing button and verify user lands on the cluster creation page in import mode
     * Click on the Create button and verify user lands on the cluster creation page
     */
    const clusterManagerPage = new ClusterManagerListPagePo('_');
    const genericCreateClusterPage = new ClusterManagerImportGenericPagePo('_');

    homePage.manangeButton().click();
    clusterManagerPage.waitForPage();

    HomePagePo.goToAndWaitForGet();
    homePage.importExistingButton().click();
    genericCreateClusterPage.waitForPage('mode=import');

    HomePagePo.goToAndWaitForGet();
    homePage.createButton().click();
    genericCreateClusterPage.waitForPage();
  });

  it('Can filter rows in the cluster list', () => {
    /**
     * Filter rows in the cluster list
     */

    sortableTable.filter('random text');
    homeClusterList.resourceTable().sortableTable().rowElements().should((el) => {
      expect(el).to.contain.text('There are no rows which match your search query.');
    });

    sortableTable.filter('local');
    homeClusterList.name('local').should((el) => {
      expect(el).to.contain.text('local');
    });
  });

  it('Can click on support links', () => {
    /**
     * Click the support links and verify user lands on the correct page
     */

    homePage.supportLinks().should('have.length', 6);

    // click Docs
    homePage.clickSupportLink(0, true);
    cy.origin('https://rancher.com', () => {
      cy.on('uncaught:exception', () => false);
      cy.url().should('include', 'ranchermanager.docs.rancher.com');
    });

    // click Forums link
    // NOTE: Cypress does not recognize when the Forum page's contents are loaded
    // which is resulting in a time out error and this test to fail
    // HomePagePo.goToAndWaitForGet();
    // homePage.clickSupportLink(1, true);
    // cy.origin('https://rancher.com', () => {
    //   cy.url().should('include', 'forums.rancher.com/');
    // });

    // click Slack link
    HomePagePo.goToAndWaitForGet();
    homePage.clickSupportLink(2, true);
    cy.origin('https://rancher.io', () => {
      cy.url().should('include', 'slack.rancher.io/');
    });

    // click File an Issue link
    HomePagePo.goToAndWaitForGet();
    homePage.clickSupportLink(3, true);
    cy.origin('https://github.com', () => {
      cy.url().should('include', 'github.com/login');
    });

    // click Get Started link
    HomePagePo.goToAndWaitForGet();
    homePage.clickSupportLink(4);
    cy.url().should('include', 'docs/getting-started');

    // click Commercial Support link
    HomePagePo.goToAndWaitForGet();
    homePage.clickSupportLink(5);
    cy.url().should('include', '/support');
  });
});
