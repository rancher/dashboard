import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import { qase } from '@/cypress/support/qase';

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

  qase(18525, it('should not provide a link to capi cluster details', () => {
    clusterList.list().name(clusterName).find('a').should('not.exist');
    clusterList.list().name('local').find('a').should('exist');
  }));

  qase(18526, it('should not allow editing CAPI cluster configs', () => {
    const capiActionMenu = clusterList.list().actionMenu(clusterName);

    capiActionMenu.getMenuItem('Edit Config').should('not.exist');

    // Close the first row action menu so its overlay does not block subsequent row actions.
    clusterList.list().actionMenuClose(clusterName);
    ActionMenuPo.checkNoActionMenuIsVisible();

    clusterList.list().actionMenu('local').getMenuItem('Edit Config').should('exist');
  }));

  qase(18527, it('should show a message indicating that CAPI clusters are not editable', () => {
    clusterList.capiWarningSubRow(clusterName)
      .should('be.visible');
    clusterList.capiWarningSubRow('Local')
      .should('not.exist');
  }));

  qase(18528, it('should not report a machine provider for CAPI clusters', () => {
    clusterList.list().provider(clusterName).should('have.text', ' RKE2');

    clusterList.list().provider('local').invoke('text').should('match', /^Local (K3s|RKE2)$/);
  }));
});
