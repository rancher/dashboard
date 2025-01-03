import { WorkloadsDaemonsetsListPagePo, WorkLoadsDaemonsetsEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-daemonsets.po';

describe('Cluster Explorer', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', () => {
    describe('Daemonsets', () => {
      it('modifying "Scaling and Upgrade Policy" to "On Delete" should use the correct property "OnDelete"', () => {
        const daemonsetName = 'daemonset-test';

        // to test payload of https://github.com/rancher/dashboard/issues/9874
        // we need to mock the PUT reply otherwise we get 409 conflict
        cy.intercept('PUT', `/v1/apps.daemonsets/default/${ daemonsetName }`, (req: any) => {
          req.reply({
            statusCode: 200,
            body:       {}
          });
        }).as('daemonsetEdit');

        // list view for daemonsets
        const workloadsDaemonsetsListPage = new WorkloadsDaemonsetsListPagePo('local');

        workloadsDaemonsetsListPage.goTo();
        workloadsDaemonsetsListPage.waitForPage();
        workloadsDaemonsetsListPage.createDaemonset();

        // create a new daemonset
        const workloadsDaemonsetsEditPage = new WorkLoadsDaemonsetsEditPagePo('local');

        workloadsDaemonsetsEditPage.nameNsDescription().name().set(daemonsetName);
        workloadsDaemonsetsEditPage.containerImageInput().set('nginx');
        workloadsDaemonsetsEditPage.saveCreateForm().click();

        workloadsDaemonsetsListPage.waitForPage();
        workloadsDaemonsetsListPage.listElementWithName(daemonsetName).should('be.visible');
        workloadsDaemonsetsListPage.goToeditItemWithName(daemonsetName);

        // edit daemonset
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
