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

  const appendData = (url, data) => {
    cy.intercept('GET', url, (req) => {
      req.continue((res) => {
        const existingData = res?.body?.data || [];

        res.body = {
          ...res.body,
          data: [...existingData, ...data]
        };
      });
    });
  };

  beforeEach(() => {
    appendData('/v1/provisioning.cattle.io.clusters*', provisioningClusters);
    appendData('/v1/management.cattle.io.clusters*', managementClusters);
    appendData('/v1/management.cattle.io.nodes*', nodes);
    appendData('/v1/namespaces*', namespaces);

    cy.login();
    HomePagePo.goTo();
  });

  it('should show a node pool tab in AKS cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();

    const aksDetailsPage = new ClusterManagerDetailHostedPagePo('_', AKS_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    clusterList.list().name('aks-mock-cluster').click();
    aksDetailsPage.waitForPage(null, 'custom');// should load with the tab from the extension active

    aksDetailsPage.resourceDetail().tabs().tabNames().should('include', 'Node Pools');

    aksDetailsPage.nodePoolTable().self().should('be.visible');

    aksDetailsPage.nodePoolTable().sortableTable().rowCount().should('eq', 2);

    aksDetailsPage.groupByPoolToolTip().waitForTooltipWithText('Group by Pool');

    aksDetailsPage.flatListToolTip().waitForTooltipWithText('Flat List');

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

    clusterList.list().name('eks-mock-cluster').click();
    eksDetailsPage.waitForPage(null, 'custom');// should load with the tab from the extension active
    eksDetailsPage.resourceDetail().tabs().tabNames().should('include', 'Node Pools');

    eksDetailsPage.nodePoolTable().self().should('be.visible');

    eksDetailsPage.nodePoolTable().sortableTable().rowCount().should('eq', 3);

    eksDetailsPage.groupByPoolToolTip().waitForTooltipWithText('Group by Pool');

    eksDetailsPage.flatListToolTip().waitForTooltipWithText('Flat List');

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

    clusterList.list().name('gke-mock-cluster').click();
    gkeDetailsPage.waitForPage(null, 'custom');// should load with the tab from the extension active
    gkeDetailsPage.resourceDetail().tabs().tabNames().should('include', 'Node Pools');

    gkeDetailsPage.nodePoolTable().self().should('be.visible');
    gkeDetailsPage.nodePoolTable().sortableTable().rowCount().should('eq', 2);

    gkeDetailsPage.groupByPoolToolTip().waitForTooltipWithText('Group by Pool');

    gkeDetailsPage.flatListToolTip().waitForTooltipWithText('Flat List');

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

  // imported cluster details should not contain a 'provisioning log' tab
  it('should not contain a provisioning log tab in import cluster details', () => {
    const clusterList = new ClusterManagerListPagePo();
    const importDetailsPage = new ClusterManagerDetailHostedPagePo('_', IMPORTED_CLUSTER);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    clusterList.list().name('imported-mock-cluster').click();
    importDetailsPage.waitForPage(null, 'events');
    importDetailsPage.resourceDetail().tabs().tabNames().should('not.include', 'Provisioning Log');
  });
});
