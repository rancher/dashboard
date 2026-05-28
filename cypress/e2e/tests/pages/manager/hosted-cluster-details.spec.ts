import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { provisioningClusters, managementClusters, nodes, namespaces } from '@/cypress/e2e/blueprints/manager/hosted-cluster-mocks';
import ClusterManagerDetailHostedPagePo from '~/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-hosted.po';

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
  });

  it('should show a node pool tab in AKS cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const aksDetailsPage = new ClusterManagerDetailHostedPagePo('_', AKS_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    cy.wait('@provClustersGet');
    cy.wait('@mgmtClustersGet');

    clusterList.list().name('aks-mock-cluster').click();
    aksDetailsPage.waitForPage();

    aksDetailsPage.resourceDetail().tabs().tabNames().should('include', 'Node Pools');

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

    clusterList.list().name('eks-mock-cluster').click();
    eksDetailsPage.waitForPage();
    eksDetailsPage.resourceDetail().tabs().tabNames().should('include', 'Node Pools');

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

    clusterList.list().name('gke-mock-cluster').click();
    gkeDetailsPage.waitForPage();
    gkeDetailsPage.resourceDetail().tabs().tabNames().should('include', 'Node Pools');

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

      clusterList.list().name(name).click();
      hostedDetailsPage.waitForPage();
      hostedDetailsPage.resourceDetail().tabs().tabNames().should('not.include', 'Autoscaler');
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

    clusterList.list().name('imported-mock-cluster').click();
    importDetailsPage.waitForPage();
    importDetailsPage.resourceDetail().tabs().tabNames().should('not.include', 'Provisioning Log');
  });
});
