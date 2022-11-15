import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ClusterManagerDetailRke2CustomPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-custom.po';
import ClusterManagerDetailImportedGenericPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-import-generic.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import ClusterManagerEditRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-rke2-custom.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.generic.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

// At some point these will come from somewhere central, then we can make tools to remove resources from this or all runs
const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const { baseUrl } = Cypress.config();
const clusterRequestBase = `${ baseUrl }/v1/provisioning.cattle.io.clusters/fleet-default`;
const clusterNamePartial = `${ runPrefix }-create`;
const rke2CustomName = `${ clusterNamePartial }-rke2-custom`;
const importGenericName = `${ clusterNamePartial }-import-generic`;

describe('Cluster Manager', () => {
  const clusterList = new ClusterManagerListPagePo();

  const detailClusterPage = new ClusterManagerDetailRke2CustomPagePo(rke2CustomName);

  beforeEach(() => {
    cy.login();
  });

  describe('Created', () => {
    const createClusterPage = new ClusterManagerCreateRke2CustomPagePo();

    describe('RKE2 Custom', () => {
      const editCreatedClusterPage = new ClusterManagerEditRke2CustomPagePo(rke2CustomName);

      it('can create new cluster', () => {
        cy.userPreferences();

        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createClusterPage.waitForPage();
        createClusterPage.rkeToggle().toggle();
        createClusterPage.selectCustom(0);
        createClusterPage.nameNsDescription().name().set(rke2CustomName);
        createClusterPage.create();

        detailClusterPage.waitForPage(undefined, 'registration');
      });

      it('can edit cluster and see changes afterwards', () => {
        cy.intercept('PUT', `${ clusterRequestBase }/${ rke2CustomName }`).as('saveRequest');

        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).clickMenuItem(0);

        editCreatedClusterPage.waitForPage('mode=edit', 'basic');
        editCreatedClusterPage.nameNsDescription().description().set(rke2CustomName);
        editCreatedClusterPage.save();

        cy.wait('@saveRequest').then(() => {
          clusterList.goTo();
          clusterList.list().actionMenu(rke2CustomName).clickMenuItem(0);

          editCreatedClusterPage.waitForPage('mode=edit', 'basic');
          editCreatedClusterPage.nameNsDescription().description().self().should('have.value', rke2CustomName);
        });
      });

      it('can view cluster YAML editor', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).clickMenuItem(1);

        editCreatedClusterPage.waitForPage('mode=edit&as=yaml');
        editCreatedClusterPage.resourceDetail().resourceYaml().checkVisible();
      });

      it('can delete cluster', () => {
        cy.intercept('DELETE', `${ clusterRequestBase }/${ rke2CustomName }`).as('deleteRequest');

        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).clickMenuItem(4);

        const promptRemove = new PromptRemove();

        promptRemove.confirm(rke2CustomName);
        promptRemove.remove();

        cy.wait('@deleteRequest').then(() => {
          return clusterList.sortableTable().rowElementWithName(rke2CustomName).should('not.exist', { timeout: 15000 });
        });
      });
    });
  });

  describe('Imported', () => {
    const importClusterPage = new ClusterManagerImportGenericPagePo();

    describe('Generic', () => {
      const editImportedClusterPage = new ClusterManagerEditGenericPagePo(importGenericName);

      it('can create new cluster', () => {
        const detailClusterPage = new ClusterManagerDetailImportedGenericPagePo(importGenericName);

        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.importCluster();

        importClusterPage.waitForPage('mode=import');
        importClusterPage.selectGeneric(0);
        importClusterPage.nameNsDescription().name().set(importGenericName);
        importClusterPage.create();

        detailClusterPage.waitForPage(undefined, 'registration');
      });

      it('can navigate to cluster edit page', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(importGenericName).clickMenuItem(0);

        editImportedClusterPage.waitForPage('mode=edit');
      });

      it('can delete cluster by bulk actions', () => {
        cy.intercept('DELETE', `${ clusterRequestBase }/${ importGenericName }`).as('deleteRequest');

        clusterList.goTo();
        clusterList.sortableTable().rowSelectCtlWithName(importGenericName).set();
        clusterList.sortableTable().bulkActionDropDownOpen();
        clusterList.sortableTable().bulkActionDropDownButton('Delete').click();

        const promptRemove = new PromptRemove();

        promptRemove.confirm(importGenericName);
        promptRemove.remove();

        cy.wait('@deleteRequest').then(() => {
          return clusterList.sortableTable().rowElementWithName(importGenericName).should('not.exist', { timeout: 15000 });
        });
      });
    });
  });

  it(`can navigate to local cluster's explore product`, () => {
    const clusterName = 'local';
    const clusterDashboard = new ClusterDashboardPagePo(clusterName);

    clusterList.goTo();
    clusterList.list().explore(clusterName).click();

    clusterDashboard.waitForPage(undefined, 'cluster-events');
  });
});
