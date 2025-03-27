import { WorkloadsReplicasetsListPagePo, WorkloadsReplicasetsEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-replicasets.po';

describe('Cluster Explorer', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', () => {
    describe('Replicasets', () => {
      const replicasetName = 'replicaset-test';

      it('should not be able to rollback a replicaset', () => {
        // list view for replicasets
        const workloadsDaemonsetsListPage = new WorkloadsReplicasetsListPagePo('local');

        workloadsDaemonsetsListPage.goTo();
        workloadsDaemonsetsListPage.waitForPage();
        workloadsDaemonsetsListPage.createReplicaset();

        // create a new replicaset
        const workloadsDaemonsetsEditPage = new WorkloadsReplicasetsEditPagePo('local');

        workloadsDaemonsetsEditPage.nameNsDescription().name().set(replicasetName);
        workloadsDaemonsetsEditPage.containerImageInput().set('nginx');
        workloadsDaemonsetsEditPage.saveCreateForm().click();

        workloadsDaemonsetsListPage.goTo();
        workloadsDaemonsetsListPage.waitForPage();

        workloadsDaemonsetsListPage.sortableTable().filter(replicasetName);
        workloadsDaemonsetsListPage.listElementWithName(replicasetName).should('be.visible');
        workloadsDaemonsetsListPage.baseResourceList().actionMenu(replicasetName).menuItemNames().should('not.contain', 'Rollback');

        cy.deleteRancherResource('v1', 'apps.replicasets', `default/${ replicasetName }`);
      });
    });
  });
});
