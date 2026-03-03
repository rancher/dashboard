import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import RolesPo from '@/cypress/e2e/po/pages/users-and-auth/roles.po';
import ClusterProjectMembersPo from '@/cypress/e2e/po/pages/explorer/cluster-project-members.po';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

Cypress.config();
describe('Side navigation: Highlighting ', { tags: ['@navigation', '@adminUser'] }, () => {
  const chartsPage = new ChartsPage();
  const chartPage = new ChartPage();
  const CHART = {
    name: 'Alerting Drivers',
    id:   'rancher-alerting-drivers',
    repo: 'rancher-charts'
  };

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Cluster and Project members is highlighted correctly', () => {
    HomePagePo.goTo();

    const productNavPo = new ProductNavPo();
    const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    clusterMembership.navToClusterMenuEntry('local');
    // if we do not wait for the cluster page to load, then we get the old side nav from Users & Authentication
    clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
    clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
    clusterMembership.waitForPage();
    productNavPo.activeNavItem().should('equal', 'Cluster and Project Members');
  });

  it('Chart and sub-pages are highlighted correctly', () => {
    HomePagePo.goTo();
    chartsPage.goTo();
    chartsPage.waitForPage();

    const productNavPo = new ProductNavPo();

    productNavPo.visibleNavTypes().eq(0).should('be.visible').click()
      .then((link) => {
        cy.url().should('equal', link.prop('href'));
      });
    productNavPo.activeNavItem().should('equal', 'Charts');

    // Wait for charts page to load - check for chart container to appear
    chartsPage.self().find('[data-testid="app-chart-cards-container"]', MEDIUM_TIMEOUT_OPT).should('be.visible');

    // Search for the chart to ensure it's available
    chartsPage.chartsSearchFilterInput().type(CHART.name);
    // Wait for search results to filter
    chartsPage.chartsSearchFilterInput().should('have.value', CHART.name);

    // Ensure the specific chart exists before trying to click it
    chartsPage.getChartByName(CHART.name).self().should('be.visible');

    // Go to install page
    chartsPage.clickChart(CHART.name);

    // Wait for navigation to the chart page to complete
    chartPage.waitForPageWithSpecificUrl(undefined, `repo-type=cluster&repo=${ CHART.repo }&chart=${ CHART.id }`);
    productNavPo.activeNavItem().should('equal', 'Charts');

    chartPage.goToInstall();
    productNavPo.activeNavItem().should('equal', 'Charts');
  });

  it('User Retention highlighting', () => {
    const usersPo = new UsersPo();
    const productNavPo = new ProductNavPo();

    usersPo.goTo();
    usersPo.waitForPage();
    productNavPo.activeNavItem().should('equal', 'Users');

    usersPo.userRetentionLink().click();
    productNavPo.activeNavItem().should('equal', 'Users');
  });

  it('Roles Template checks handling of hash in URL', () => {
    const productNavPo = new ProductNavPo();
    const roles = new RolesPo(BLANK_CLUSTER);
    const GLOBAL = 'GLOBAL';
    const CLUSTER = 'CLUSTER';

    roles.goTo(undefined, GLOBAL);
    roles.waitForPage(undefined, GLOBAL);
    roles.list(GLOBAL).rowWithName('Administrator').checkExists();
    productNavPo.activeNavItem().should('equal', 'Role Templates');

    roles.tabs().clickTabWithName(CLUSTER);
    roles.list(CLUSTER).rowWithName('Cluster Owner').checkExists();
    productNavPo.activeNavItem().should('equal', 'Role Templates');
  });
});
