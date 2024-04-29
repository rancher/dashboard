import { WorkloadsDaemonsetsListPagePo, WorkLoadsDaemonsetsEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-daemonsets.po';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

describe('Cluster Explorer', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    generateFakeClusterDataAndIntercepts(fakeProvClusterId, fakeMgmtClusterId);

    // to test payload of https://github.com/rancher/dashboard/issues/9874
<<<<<<< HEAD
    cy.intercept('PUT', `k8s/clusters/${ fakeMgmtClusterId }/v1/apps.daemonsets/calico-system/calico-node`, (req: any) => {
=======
    cy.intercept('PUT', 'k8s/clusters/some-fake-mgmt-id/v1/apps.daemonsets/calico-system/calico-node', (req: any) => {
>>>>>>> 710cc8c9b7 (add e2e test for issue)
      req.reply({
        statusCode: 200,
        body:       { value: {} }
      });
    }).as('daemonsetEdit');

<<<<<<< HEAD
    // to prevent error when rendering the daemonsets list after save (otherwise test will fail)
    cy.intercept('GET', `k8s/clusters/${ fakeMgmtClusterId }/v1/nodes`, (req: any) => {
      req.reply({
        statusCode: 200,
        body:       { data: [] }
      });
    }).as('nodesReq');

=======
>>>>>>> 710cc8c9b7 (add e2e test for issue)
    cy.login();
  });

  describe('Workloads', () => {
    describe('Daemonsets', () => {
      it('modifying "Scaling and Upgrade Policy" to "On Delete" should use the correct property "OnDelete"', () => {
        // same name as in blueprints/nav/k8s-schemas/apps.daemonsets
        const daemonsetName = 'calico-node';

        // list view daemonsets
        const workloadsDaemonsetsListPage = new WorkloadsDaemonsetsListPagePo(fakeMgmtClusterId);

        workloadsDaemonsetsListPage.goTo();
        workloadsDaemonsetsListPage.listElementWithName(daemonsetName).should('be.visible');
        workloadsDaemonsetsListPage.goToeditItemWithName(daemonsetName);

        // edit view daemonsets
        const workloadsDaemonsetsEditPage = new WorkLoadsDaemonsetsEditPagePo(fakeMgmtClusterId);

        workloadsDaemonsetsEditPage.clickTab('#DaemonSet');
        workloadsDaemonsetsEditPage.clickTab('#upgrading');
        workloadsDaemonsetsEditPage.ScalingUpgradePolicyRadioBtn().set(1);
        workloadsDaemonsetsEditPage.saveCreateForm().click();

        workloadsDaemonsetsListPage.listElementWithName(daemonsetName).should('be.visible');

        cy.wait('@daemonsetEdit', { requestTimeout: 4000 }).then((req) => {
          expect(req.request.body.spec.updateStrategy.type).to.equal('OnDelete');
        });
      });
    });
  });
});
