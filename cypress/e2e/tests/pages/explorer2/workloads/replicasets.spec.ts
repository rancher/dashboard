import { WorkloadsReplicasetsListPagePo, WorkloadsReplicasetsEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-replicasets.po';
import ResourceSearchDialog from '@/cypress/e2e/po/prompts/ResourceSearchDialog.po';

describe('Cluster Explorer', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', () => {
    describe('Replicasets', () => {
      const replicasetName = '0000-replicaset-test';

      it('should not be able to rollback a replicaset', () => {
        // list view for replicasets
        const workloadsReplicasetsListPage = new WorkloadsReplicasetsListPagePo('local');

        workloadsReplicasetsListPage.goTo();
        workloadsReplicasetsListPage.waitForPage();
        workloadsReplicasetsListPage.createReplicaset();

        // create a new replicaset
        const workloadsDaemonsetsEditPage = new WorkloadsReplicasetsEditPagePo('local');

        workloadsDaemonsetsEditPage.nameNsDescription().name().set(replicasetName);
        workloadsDaemonsetsEditPage.containerImageInput().set('nginx');
        workloadsDaemonsetsEditPage.saveCreateForm().click();

        ResourceSearchDialog.goToResource('ReplicaSets');

        workloadsReplicasetsListPage.waitForPage();

        workloadsReplicasetsListPage.listElementWithName(replicasetName).should('be.visible');
        workloadsReplicasetsListPage.baseResourceList().actionMenu(replicasetName).menuItemNames().should('not.contain', 'Rollback');

        cy.deleteRancherResource('v1', 'apps.replicasets', `default/${ replicasetName }`);
      });
    });
  });
});
