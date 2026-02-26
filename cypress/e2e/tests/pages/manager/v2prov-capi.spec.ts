import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

import { mockCapiMgmtCluster, mockCapiProvCluster } from '@/cypress/e2e/blueprints/manager/v2prov-capi-cluster-mocks';

describe('Cluster List - v2 Provisioning CAPI Clusters', { tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const clusterName = 'mocked-capi';

  // add mocked CAPI cluster to provisioning and management cluster lists
  beforeEach(() => {
    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`, (req) => {
      req.continue((res) => {
        res.body.data.push(mockCapiProvCluster);

        res.send(res.body);
      });
    }).as('provClusters');

    cy.intercept('GET', `/v1/management.cattle.io.clusters?*`, (req) => {
      req.continue((res) => {
        res.body.data.push(mockCapiMgmtCluster);
        res.send(res.body);
      });
    }).as('mgmtClusters');

    cy.login();
    HomePagePo.goTo();
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
  });

  it('should not provide a link to capi cluster details', () => {
    clusterList.list().name(clusterName).find('a').should('not.exist');
    clusterList.list().name('local').find('a').should('exist');
  });

  it('should not allow editing CAPI cluster configs', () => {
    clusterList.list().actionMenu(clusterName).getMenuItem('Edit Config').should('not.exist');
    clusterList.list().actionMenu('local').getMenuItem('Edit Config').should('exist');
  });

  it('should show a message indicating that CAPI clusters are not editable', () => {
    clusterList.list().rowWithName(clusterName).description().find('.text-error')
      .should('be.visible');
    clusterList.list().rowWithName('local').description().should('not.exist');
  });

  it('should not report a machine provider for CAPI clusters', () => {
    clusterList.list().provider(clusterName).should('have.text', ' RKE2');
    clusterList.list().provider('local').should('have.text', 'Local K3s');
  });
});
