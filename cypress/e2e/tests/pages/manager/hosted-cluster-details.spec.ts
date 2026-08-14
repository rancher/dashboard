import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { provisioningClusters, managementClusters, nodes, namespaces } from '@/cypress/e2e/blueprints/manager/hosted-cluster-mocks';
import ClusterManagerDetailHostedPagePo from '~/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-hosted.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

// [CREATE ISSUE TO INVESTIGATE] The tabbed component on a cluster detail page intermittently fails to
// mount after an in-app (SPA) navigation and then never appears on that page load; the app should
// render it reliably (or recover) rather than needing a fresh navigation.
//
// The tabbed component on a hosted cluster detail page intermittently fails to render after an
// in-app navigation (it never appears in that page load). Rather than reload the page (which we
// avoid), navigate from the cluster list and, if the tabs did not render, go back to the list and
// try again a few times - the failure is intermittent, so a fresh navigation usually succeeds.
//
// Click the <a> link itself, not the surrounding cell: name() yields the <td> (column(2)) and
// Cypress clicks an element's centre - in a column wider than the cluster name that centre lands on
// cell padding beside the <a>, so the click silently does not navigate and waitForPage times out.
const openHostedClusterDetail = (
  clusterList: ClusterManagerListPagePo,
  clusterName: string,
  detailsPage: ClusterManagerDetailHostedPagePo,
  navAttempt = 0
): void => {
  clusterList.list().name(clusterName).find('a').should('be.visible')
    .click();
  detailsPage.waitForPage();

  // Poll for the tabbed component for a fair window before deciding the intermittent SPA-mount bug
  // hit (where it never appears on that page load). We must only re-navigate on a genuine render
  // failure - not on a page that simply has not finished rendering the tabs yet. Checking too early
  // and recovering off the wrong state is exactly what made the logging recovery navigate when it
  // did not need to.
  const ensureTabsRendered = (poll = 0): void => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="tabbed"]').length > 0) {
        return; // tabs rendered - let the caller's checkVisible/tabNames assert on them
      }

      if (poll < 8) {
        cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
        ensureTabsRendered(poll + 1);
      } else if (navAttempt < 3) {
        // The tabs genuinely did not render on this load; re-navigate to force a fresh render.
        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        openHostedClusterDetail(clusterList, clusterName, detailsPage, navAttempt + 1);
      }
    });
  };

  ensureTabsRendered();
};

// A tab's label gains an inferred count suffix once its content is counted (e.g. "Node Pools" ->
// "Node Pools (2)", see Tab.vue labelDisplay). That count populates asynchronously - before or after
// these assertions run - so an exact tabNames().should('include', 'Node Pools') is racy and fails
// once the count has appeared. Compare against the base label with any trailing " (N)" count
// stripped, so the check holds whether or not the count has populated. This also fixes the negative
// checks: a bare not.include('Autoscaler') would slip past an "Autoscaler (0)" tab.
const stripTabCount = (name: string): string => name.replace(/\s*\(\d+\)$/, '').trim();

const assertHasTab = (detailsPage: ClusterManagerDetailHostedPagePo, tabName: string): void => {
  detailsPage.resourceDetail().tabs().tabNames().should((names: any) => {
    expect((names as string[]).map(stripTabCount)).to.include(tabName);
  });
};

const assertNoTab = (detailsPage: ClusterManagerDetailHostedPagePo, tabName: string): void => {
  detailsPage.resourceDetail().tabs().tabNames().should((names: any) => {
    expect((names as string[]).map(stripTabCount)).to.not.include(tabName);
  });
};

describe('Hosted Cluster Details', { tags: ['@manager', '@adminUser'] }, () => {
  // ids from hosted-cluster-mocks
  const AKS_CLUSTER = 'c-9zj2b';
  const GKE_CLUSTER = 'c-5hrg8';
  const EKS_CLUSTER = 'c-4sjtl';
  const IMPORTED_CLUSTER = 'c-kkwv2';

  beforeEach(() => {
    cy.intercept('GET', /\/v1\/provisioning\.cattle\.io\.clusters/, (req) => {
      req.continue((res) => {
        res.send(200, {
          ...res.body,
          data: provisioningClusters
        });
      });
    }).as('provClustersGet');

    cy.intercept('GET', /\/v1\/management\.cattle\.io\.clusters/, (req) => {
      req.continue((res) => {
        res.send(200, {
          ...res.body,
          data: managementClusters
        });
      });
    }).as('mgmtClustersGet');

    cy.intercept('GET', /\/v1\/namespaces/, (req) => {
      req.continue((res) => {
        res.send(200, {
          ...res.body,
          data: namespaces
        });
      });
    });

    // using pathname and a more generic url for nodes because the other intercept format had issues parsing query params w/ brackets
    cy.intercept({ method: 'GET', pathname: '/v1/management.cattle.io.nodes/*' }, (req) => {
      const urlPath = new URL(req.url).pathname;
      const clusterId = urlPath.split('/').pop();
      const filteredNodes = nodes.filter((n) => n.id.startsWith(`${ clusterId }/`));

      req.reply({
        statusCode: 200,
        body:       {
          data:     filteredNodes,
          count:    filteredNodes.length,
          revision: '1'
        }
      });
    }).as('mgmtNodesGet');

    // Intercept individual cluster requests
    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters/fleet-default/${ AKS_CLUSTER }*`, {
      statusCode: 200,
      body:       provisioningClusters.find((c) => c.id === `fleet-default/${ AKS_CLUSTER }`)
    });

    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters/fleet-default/${ GKE_CLUSTER }*`, {
      statusCode: 200,
      body:       provisioningClusters.find((c) => c.id === `fleet-default/${ GKE_CLUSTER }`)
    });

    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters/fleet-default/${ EKS_CLUSTER }*`, {
      statusCode: 200,
      body:       provisioningClusters.find((c) => c.id === `fleet-default/${ EKS_CLUSTER }`)
    });

    cy.intercept('GET', `/v1/management.cattle.io.clusters/${ AKS_CLUSTER }*`, {
      statusCode: 200,
      body:       managementClusters.find((c) => c.id === AKS_CLUSTER)
    });

    cy.intercept('GET', `/v1/management.cattle.io.clusters/${ GKE_CLUSTER }*`, {
      statusCode: 200,
      body:       managementClusters.find((c) => c.id === GKE_CLUSTER)
    });

    cy.intercept('GET', `/v1/management.cattle.io.clusters/${ EKS_CLUSTER }*`, {
      statusCode: 200,
      body:       managementClusters.find((c) => c.id === EKS_CLUSTER)
    });

    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters/fleet-default/${ IMPORTED_CLUSTER }*`, {
      statusCode: 200,
      body:       provisioningClusters.find((c) => c.id === `fleet-default/${ IMPORTED_CLUSTER }`)
    });

    cy.intercept('GET', `/v1/management.cattle.io.clusters/${ IMPORTED_CLUSTER }*`, {
      statusCode: 200,
      body:       managementClusters.find((c) => c.id === IMPORTED_CLUSTER)
    });

    cy.login();
    HomePagePo.goTo();

    // Wait for the home page to fully settle before any test navigates into a cluster detail.
    // The home page fires the same provisioning/management cluster GETs the tests wait on; if we
    // navigate away before they complete, the store is left half-loaded and the detail page's
    // tabbed component fails to mount (the blank screen we see). Waiting here also *consumes* the
    // home page's occurrence of these aliases, so each test's later
    // cy.wait('@provClustersGet')/cy.wait('@mgmtClustersGet') correctly gates on the cluster LIST's
    // request instead of resolving instantly against the home page's already-finished one.
    const homePage = new HomePagePo();

    homePage.waitForPage();
    homePage.list().checkVisible(MEDIUM_TIMEOUT_OPT);
    cy.wait('@provClustersGet');
    cy.wait('@mgmtClustersGet');
  });

  it('should show a node pool tab in AKS cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const aksDetailsPage = new ClusterManagerDetailHostedPagePo('_', AKS_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    cy.wait('@provClustersGet');
    cy.wait('@mgmtClustersGet');

    // Use the shared open helper (like the EKS/GKE tests) so the intermittent SPA-mount bug - where
    // the tabbed component never renders on a given page load - is recovered by re-navigation instead
    // of failing outright with "[data-testid=tabbed] not found".
    openHostedClusterDetail(clusterList, 'aks-mock-cluster', aksDetailsPage);

    assertHasTab(aksDetailsPage, 'Node Pools');

    // ensure the node pool tab is the first tab
    aksDetailsPage.nodePoolTable().self().should('be.visible');
    cy.wait('@mgmtNodesGet');
    aksDetailsPage.nodePoolTable().sortableTable().rowCount().should('eq', 2);

    aksDetailsPage.groupByPoolToolTip().waitForTooltipWithText('Group by Pool');

    aksDetailsPage.flatListToolTip().waitForTooltipWithText('Flat List');
    aksDetailsPage.nodePoolTable().sortableTable().groupByButtons(1).click();

    // node pool table should not have a 'group by namespace' button
    aksDetailsPage.nodePoolTable().sortableTable().groupByButtons(2)
      .should('not.exist');

    aksDetailsPage.nodePoolTable().sortableTable().groupRowCount('agentpool').should('eq', 1);
    aksDetailsPage.nodePoolTable().sortableTable().groupRowCount('pool1').should('eq', 1);

    // agentpool subheader should include System eastus Standard_D2d_v4
    aksDetailsPage.nodePoolTable().sortableTable().groupElementWithName('agentpool')
      .should('contain.text', 'System – eastus – Standard_D2d_v4');

    // pool1 subheader should include User eastus Standard_D2d_v4
    aksDetailsPage.nodePoolTable().sortableTable().groupElementWithName('pool1')
      .should('contain.text', 'User – eastus – Standard_D2d_v4');

    // check that the internal/external IPs column is rendering at least an internal IP, not -/-
    aksDetailsPage.nodePoolTable().sortableTable().getTableCell(0, 3).contains(/\d+/);
  });

  it('should show a node pool tab in EKS cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const eksDetailsPage = new ClusterManagerDetailHostedPagePo('_', EKS_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    cy.wait('@provClustersGet');
    cy.wait('@mgmtClustersGet');

    openHostedClusterDetail(clusterList, 'eks-mock-cluster', eksDetailsPage);
    eksDetailsPage.resourceDetail().tabs().checkVisible(MEDIUM_TIMEOUT_OPT);
    assertHasTab(eksDetailsPage, 'Node Pools');

    // ensure the node pool tab is the first tab
    eksDetailsPage.nodePoolTable().self().should('be.visible');
    cy.wait('@mgmtNodesGet');
    eksDetailsPage.nodePoolTable().sortableTable().rowCount().should('eq', 3);

    eksDetailsPage.groupByPoolToolTip().waitForTooltipWithText('Group by Pool');

    eksDetailsPage.flatListToolTip().waitForTooltipWithText('Flat List');
    eksDetailsPage.nodePoolTable().sortableTable().groupByButtons(1).click();

    // node pool table should not have a 'group by namespace' button
    eksDetailsPage.nodePoolTable().sortableTable().groupByButtons(2)
      .should('not.exist');

    eksDetailsPage.nodePoolTable().sortableTable().groupRowCount('group1').should('eq', 2);
    eksDetailsPage.nodePoolTable().sortableTable().groupRowCount('group2').should('eq', 1);

    eksDetailsPage.nodePoolTable().sortableTable().groupElementWithName('group1')
      .should('contain.text', 'us-west-2 – t3.medium');

    eksDetailsPage.nodePoolTable().sortableTable().groupElementWithName('group2')
      .should('contain.text', 'us-west-2 – t3.medium');

    // check that the internal/external IPs column is rendering at least an internal IP, not -/-
    eksDetailsPage.nodePoolTable().sortableTable().getTableCell(0, 3).contains(/\d+/);
  });

  it('should show a node pool tab in GKE cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const gkeDetailsPage = new ClusterManagerDetailHostedPagePo('_', GKE_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    cy.wait('@provClustersGet');
    cy.wait('@mgmtClustersGet');

    openHostedClusterDetail(clusterList, 'gke-mock-cluster', gkeDetailsPage);
    gkeDetailsPage.resourceDetail().tabs().checkVisible(MEDIUM_TIMEOUT_OPT);
    assertHasTab(gkeDetailsPage, 'Node Pools');

    // ensure the node pool tab is the first tab
    gkeDetailsPage.nodePoolTable().self().should('be.visible');
    cy.wait('@mgmtNodesGet');
    gkeDetailsPage.nodePoolTable().sortableTable().rowCount().should('eq', 2);

    gkeDetailsPage.groupByPoolToolTip().waitForTooltipWithText('Group by Pool');

    gkeDetailsPage.flatListToolTip().waitForTooltipWithText('Flat List');
    gkeDetailsPage.nodePoolTable().sortableTable().groupByButtons(1).click();

    // node pool table should not have a 'group by namespace' button
    gkeDetailsPage.nodePoolTable().sortableTable().groupByButtons(2)
      .should('not.exist');

    gkeDetailsPage.nodePoolTable().sortableTable().groupRowCount('group-1').should('eq', 1);
    gkeDetailsPage.nodePoolTable().sortableTable().groupRowCount('group-2').should('eq', 1);
    gkeDetailsPage.nodePoolTable().sortableTable().groupElementWithName('group-1')
      .should('contain.text', 'us-central1 – n1-standard-2');

    gkeDetailsPage.nodePoolTable().sortableTable().groupElementWithName('group-2')
      .should('contain.text', 'us-central1 – n1-standard-2');

    // check that the internal/external IPs column is rendering at least an internal IP, not -/-
    gkeDetailsPage.nodePoolTable().sortableTable().getTableCell(0, 3).contains(/\d+/);
  });

  it('should not show an autoscaler tab in GKE, AKS, or EKS cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const hostedClusters = [
      {
        id:   AKS_CLUSTER,
        name: 'aks-mock-cluster'
      },
      {
        id:   EKS_CLUSTER,
        name: 'eks-mock-cluster'
      },
      {
        id:   GKE_CLUSTER,
        name: 'gke-mock-cluster'
      }
    ];

    hostedClusters.forEach(({ id, name }) => {
      const hostedDetailsPage = new ClusterManagerDetailHostedPagePo('_', id);

      ClusterManagerListPagePo.navTo();
      clusterList.waitForPage();
      cy.wait('@provClustersGet');
      cy.wait('@mgmtClustersGet');

      openHostedClusterDetail(clusterList, name, hostedDetailsPage);
      hostedDetailsPage.resourceDetail().tabs().checkVisible(MEDIUM_TIMEOUT_OPT);

      assertNoTab(hostedDetailsPage, 'Autoscaler');
    });
  });

  // imported cluster details should not contain a 'provisioning log' tab
  it('should not contain a provisioning log tab in import cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const importDetailsPage = new ClusterManagerDetailHostedPagePo('_', IMPORTED_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    cy.wait('@provClustersGet');
    cy.wait('@mgmtClustersGet');

    openHostedClusterDetail(clusterList, 'imported-mock-cluster', importDetailsPage);
    importDetailsPage.resourceDetail().tabs().checkVisible(MEDIUM_TIMEOUT_OPT);
    assertNoTab(importDetailsPage, 'Provisioning Log');
  });
});
