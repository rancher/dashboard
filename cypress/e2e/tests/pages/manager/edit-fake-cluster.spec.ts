import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';
import { CURRENT_RANCHER_VERSION } from '@shell/config/version.js';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';

const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

const clusterList = new ClusterManagerListPagePo('_');
const loadingPo = new LoadingPo();
const editCluster = new ClusterManagerEditGenericPagePo('_', fakeProvClusterId);

describe('Cluster Edit', { tags: ['@manager', '@adminUser'] }, () => {
  describe('Cluster Edit (Fake DO cluster)', () => {
    beforeEach(() => {
      generateFakeClusterDataAndIntercepts({
        fakeProvClusterId, fakeMgmtClusterId, addEditClusterCapabilities: true
      });

      cy.login();

      HomePagePo.goTo();

      cy.wait('@mgmtClustersSideNav');
      cy.wait('@mgmtClustersLists');
      cy.wait('@provClusters');

      clusterList.navToMenuEntry('Cluster Management');
      clusterList.waitForPage();

      cy.wait('@mgmtClustersLists');
      cy.wait('@provClusters');

      clusterList.editCluster(fakeProvClusterId);

      editCluster.waitForPage();
    });

    it('Clearing a registry auth item on the UI (Cluster Edit Config) should retain its authentication ID', () => {
      editCluster.clickTab('#registry');
      editCluster.registryAuthenticationItems().closeArrayListItem(0);

      // registries is populated in fake-cluster -> "generateProvClusterObj" -> "spec.rkeConfig.registries"
      // secrets need to be populated also, check fake-cluster -> INTERCEPT -> cy.intercept('GET', `/v1/secrets?*` ....)
      editCluster.registryAuthenticationField().checkOptionSelected('registryconfig-auth-reg2 (HTTP Basic Auth: aaa)');
    });

    // testing https://github.com/rancher/dashboard/issues/10192
    it('"documentation" link in editing a cluster should open in a new tab', () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

      // Don't click until the loading indicator isn't there....
      loadingPo.checkNotExists();

      // since in Cypress we cannot assert directly a link on a new tab
      // next best thing is to assert that the link has _blank
      // change it to _seft, then assert the link of the new page
      cy.get('[data-testid="edit-cluster-reprovisioning-documentation"] a').should('be.visible')
        .then(($a) => {
          expect($a).to.have.attr('target', '_blank');
          // update attr to open in same tab
          $a.attr('target', '_self');
        })
        .click();

      cy.url().should('include', `https://ranchermanager.docs.rancher.com/v${ CURRENT_RANCHER_VERSION }/how-to-guides/new-user-guides/launch-kubernetes-with-rancher#launching-kubernetes-on-new-nodes-in-an-infrastructure-provider`);
    });
  });
});
