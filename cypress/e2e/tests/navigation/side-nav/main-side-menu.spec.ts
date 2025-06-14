import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import { generateMockClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/clusters/fake-clusters-multi';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';

const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-description';
const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

Cypress.config();
describe('Side Menu: main', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Needs intercepts BEFORE route navigation', () => {
    beforeEach(() => {
      generateFakeClusterDataAndIntercepts(fakeProvClusterId, fakeMgmtClusterId);

      HomePagePo.goTo();
    });

    it('Pressing keyboard combo should display appropriate icon on cluster menu icon box', { tags: ['@navigation', '@adminUser'] }, () => {
      const sideNav = new ProductNavPo();
      const pagePoFake = new PagePo('');

      // nav to project/namespaces in the fake cluster
      pagePoFake.navToClusterMenuEntry(fakeProvClusterId);
      sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');

      BurgerMenuPo.burgerMenuGetNavClusterbyLabel('local').should('exist');
      BurgerMenuPo.burgerMenuGetNavClusterbyLabel(fakeProvClusterId).should('exist');

      // press key combo
      cy.get('body').focus().type('{alt}', { release: false });

      // assert that icons are displayed for the key combo
      BurgerMenuPo.burgerMenuNavClusterKeyComboIconCheck(0);
      BurgerMenuPo.burgerMenuNavClusterKeyComboIconCheck(1);

      // nav to local
      pagePoFake.navToClusterMenuEntry('local');

      // assert that we are on the expected page
      cy.url().should('include', '/local');
      cy.url().should('include', '/projectsnamespaces');
    });

    it('Local cluster should show a name and description on the side menu and display a tooltip when hovering it show the full name and description', { tags: ['@navigation', '@adminUser'] }, () => {
      BurgerMenuPo.toggle();

      const burgerMenuPo = new BurgerMenuPo();

      // we cannot assert text truncation because it always adds to the HTML the full content
      // truncation (text-overflow: ellipsis) is just a CSS gimick thing that adds the ... visually
      burgerMenuPo.getClusterDescription().should('include', longClusterDescription);
      burgerMenuPo.showClusterDescriptionTooltip();
      burgerMenuPo.getClusterDescriptionTooltipContent().should('include.text', 'local').and('be.visible');
      burgerMenuPo.getClusterDescriptionTooltipContent().should('include.text', longClusterDescription).and('be.visible');
    });
  });

  describe('No intercepts needed before route navigation', () => {
    beforeEach(() => {
      HomePagePo.goTo();
      BurgerMenuPo.toggle();
    });

    it('Opens and closes on menu icon click', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      BurgerMenuPo.checkOpen();
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkClosed();
    });

    it('Can display list of available clusters', { tags: ['@navigation', '@adminUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      burgerMenuPo.clusterNotPinnedList().should('exist');
    });

    it('Pinned and unpinned cluster', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      burgerMenuPo.pinFirstCluster();
      burgerMenuPo.clusterPinnedList().should('exist');
      burgerMenuPo.unpinFirstCluster();
      burgerMenuPo.clusterPinnedList().should('not.exist');
    });

    it('Can display at least one menu category label', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      burgerMenuPo.categories().should('have.length', 1);
    });

    it('Should show tooltip on mouse-hover when the menu is collapsed', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      burgerMenuPo.allClusters().first().trigger('mouseover');
      BurgerMenuPo.checkIconTooltipOff();
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkIconTooltipOn();
    });

    // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
    // it.skip('Contains valid links', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    //   const burgerMenuPo = new BurgerMenuPo();
    //   // Navigate through all the links

    //   burgerMenuPo.links().each((_, idx) => {
    //   // Cant bind to looped element due DOM changes while opening/closing side bar
    //     burgerMenuPo.links().eq(idx).should('be.visible').click({ force: true })
    //       .then((linkEl) => {
    //         cy.location('href').should('exist');
    //       });
    //   });
    // });

    it('Check first item in global section is Cluster Management', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      HomePagePo.goTo();
      BurgerMenuPo.categoryByLabel('Global Apps').parent().parent().get('.option-link')
        .first()
        .should('contain.text', 'Cluster Management');
    });
  });

  describe('Cluster List in Side Nav Menu', { tags: ['@vai', '@navigation', '@adminUser'] }, () => {
    const clusterData: { provId: string; mgmtId: string }[] = [];
    const clusterCount = 101;
    const burgerMenuPo = new BurgerMenuPo();

    beforeEach(() => {
      // Generate multiple fake clusters
      const clusters = Array.from({ length: clusterCount }, (_, i) => ({
        provId: `fake-cluster-${ i }`,
        mgmtId: `fake-mgmt-${ i }`
      }));

      clusterData.push(...clusters);

      // Set up intercepts for all clusters at once
      generateMockClusterDataAndIntercepts(clusters);

      // Intercept /v1/counts to reflect the correct number of clusters
      cy.intercept('GET', '/v1/counts*', (req) => {
        req.reply({
          statusCode: 200,
          body:       {
            data: [{
              id:     'count',
              type:   'count',
              counts: { 'management.cattle.io.cluster': { summary: { count: clusterCount + 1 } } }
            }]
          }
        });
      }).as('counts');

      HomePagePo.goTo();
    });

    it('Should limit initial cluster display to MENU_MAX_CLUSTERS', () => {
      burgerMenuPo.allClusters().should('have.length', 10);
    });

    it('Should filter clusters by search term and update count', () => {
      BurgerMenuPo.toggle();

      // Initial state verification
      burgerMenuPo.clustersSearchCount().should('contain.text', clusterCount + 1);
      burgerMenuPo.clustersSearchInput().should('be.visible');
      burgerMenuPo.clustersSearchInput().should('have.value', '');

      // Test single cluster search
      burgerMenuPo.filterClusters('local');
      burgerMenuPo.clustersSearchInput().should('have.value', 'local');
      burgerMenuPo.allClusters().should('have.length', 1);
      burgerMenuPo.allClusters().should('contain.text', 'local');
      burgerMenuPo.allClusters().should('not.contain.text', clusterData[1].provId);
      burgerMenuPo.clustersSearchCount().should('contain.text', '1');

      // Test multiple clusters search
      burgerMenuPo.filterClusters(clusterData[1].provId);
      burgerMenuPo.clustersSearchInput().should('have.value', clusterData[1].provId);
      burgerMenuPo.allClusters().should('have.length', 12);
      burgerMenuPo.clustersSearchCount().should('contain.text', '12');
      burgerMenuPo.allClusters().should('contain.text', clusterData[1].provId);
      burgerMenuPo.allClusters().should('not.contain.text', 'local');
      burgerMenuPo.allClusters().should('not.contain.text', clusterData[0].provId);
    });

    it('Should navigate to cluster dashboard when selecting a cluster', () => {
      burgerMenuPo.goToCluster(clusterData[1].provId);

      const clusterDashboard = new ClusterDashboardPagePo(clusterData[1].mgmtId);

      clusterDashboard.waitForPage(null, 'cluster-certs');
    });

    it('Should navigate to cluster management when clicking see all clusters', () => {
      BurgerMenuPo.toggle();
      burgerMenuPo.seeAllClustersButton().click();

      const clusterManagement = new ClusterManagerListPagePo();

      clusterManagement.waitForPage();
    });

    it('Should handle pinning and unpinning of multiple clusters', () => {
      BurgerMenuPo.toggle();

      // Pin clusters one by one and verify count after each pin
      for (let i = 0; i < 5; i++) {
        burgerMenuPo.pinFirstCluster();
        burgerMenuPo.clusterPinnedList().should('have.length', i + 1);
      }

      // Verify final pinned clusters count
      burgerMenuPo.clusterPinnedList().should('have.length', 5);

      // Unpin clusters one by one and verify count after each unpin
      for (let i = 5; i > 0; i--) {
        burgerMenuPo.unpinFirstCluster();
        burgerMenuPo.clusterPinnedList().should('have.length', i - 1);
      }

      // Verify pinned section is removed after unpinning all clusters
      burgerMenuPo.clusterPinnedList().should('not.exist');
    });

    after('clean up', () => {
      cy.setUserPreference({ 'pinned-clusters': '[]' });
    });
  });
});
