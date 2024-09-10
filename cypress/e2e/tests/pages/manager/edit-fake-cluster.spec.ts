import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

describe.skip('[Vue3 Skip]: Cluster Edit', { tags: ['@manager', '@adminUser'] }, () => {
  describe('Cluster Edit (Fake DO cluster)', () => {
    beforeEach(() => {
      generateFakeClusterDataAndIntercepts(fakeProvClusterId, fakeMgmtClusterId, true);

      cy.login();
    });

    it('Clearing a registry auth item on the UI (Cluster Edit Config) should retain its authentication ID', () => {
      HomePagePo.goTo();
      const burgerMenu = new BurgerMenuPo();

      BurgerMenuPo.toggle();
      const clusterManagementNavItem = burgerMenu.links().contains(`Cluster Management`);

      clusterManagementNavItem.should('exist');
      clusterManagementNavItem.click();
      const clusterList = new ClusterManagerListPagePo('_');

      clusterList.waitForPage();
      clusterList.editCluster(fakeProvClusterId);

      const editCluster = new ClusterManagerEditGenericPagePo('_', fakeProvClusterId);

      editCluster.clickTab('#registry');
      editCluster.registryAuthenticationItems().closeArrayListItem(0);

      // registries is populated in fake-cluster -> "generateProvClusterObj" -> "spec.rkeConfig.registries"
      // secrets need to be populated also, check fake-cluster -> INTERCEPT -> cy.intercept('GET', `/v1/secrets?*` ....)
      editCluster.registryAuthenticationField().checkOptionSelected('registryconfig-auth-reg2 (HTTP Basic Auth: aaa)');
    });
  });
});
