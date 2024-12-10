import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';
import { CURRENT_RANCHER_VERSION } from '@shell/config/version.js';
import PagePo from '@/cypress/e2e/po/pages/page.po';

import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

describe('Cluster Edit', { tags: ['@manager', '@adminUser'] }, () => {
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

    // testing https://github.com/rancher/dashboard/issues/10192
    it('"documentation" link in editing a cluster should open in a new tab', () => {
      HomePagePo.goTo();

      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

      const page = new PagePo('');
      const clusterList = new ClusterManagerListPagePo('_');

      page.navToMenuEntry('Cluster Management');
      clusterList.waitForPage();

      clusterList.list().actionMenu(fakeProvClusterId).getMenuItem('Edit Config').click();

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

      cy.url().should('include', `https://ranchermanager.docs.rancher.com/v${ CURRENT_RANCHER_VERSION }/how-to-guides/new-user-guides/launch-kubernetes-with-rancher/rke1-vs-rke2-differences#cluster-api`);
    });
  });
});
