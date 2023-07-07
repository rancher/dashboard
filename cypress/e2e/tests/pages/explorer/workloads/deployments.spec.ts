import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint, deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', () => {
    let deploymentsListPage: WorkloadsDeploymentsListPagePo;
    let deploymentsCreatePage: WorkloadsDeploymentsCreatePagePo;

    const e2eWorkloads: { name: string; namespace: string; }[] = [];

    beforeEach(() => {
      deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo('local');
    });

    describe('Create: Deployments', () => {
      beforeEach(() => {
        cy.interceptAny('POST');
      });

      it('should be able to create a new deployment with basic options', () => {
        const { name, namespace } = deploymentCreateRequest.metadata;
        const containerImage = 'nginx';

        deploymentsCreatePage.goTo();

        deploymentsCreatePage.createWithUI(name, containerImage, namespace);

        cy.wait('@interceptAnyReq').then(({ request, response }) => {
          expect(request.body).to.deep.eq(deploymentCreateRequest);
          expect(response.statusCode).to.eq(201);
          expect(response.body.metadata.name).to.eq(name);
          expect(response.body.metadata.namespace).to.eq(namespace);
        });

        // Collect the name of the workload for cleanup
        e2eWorkloads.push({ name, namespace });
      });
    });

    describe('Update: Deployments', () => {
      const { name: workloadName, namespace } = createDeploymentBlueprint.metadata;
      const workloadDetailsPage = new WorkloadsDeploymentsDetailsPagePo(workloadName);

      // Collect the name of the workload for cleanup
      e2eWorkloads.push({ name: workloadName, namespace });

      beforeEach(() => {
        cy.intercept('GET', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('testWorkload');
        cy.intercept('GET', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('clonedPod');

        deploymentsCreatePage.goTo();
        deploymentsCreatePage.createWithKubectl(createDeploymentBlueprint);
      });

      it('Should be able to scale the number of pods', () => {
        workloadDetailsPage.goTo();
        workloadDetailsPage.mastheadTitle().should('contain', workloadName);
      });
    });

    describe('List: Deployments', () => {
      // To reduce test runtime, will use the same workload for all the tests
      it('Should list the workloads', () => {
        deploymentsListPage.goTo();
      });
    });

    // This is here because need to delete the workload after the test
    // But need to reuse the same workload for multiple tests
    after(() => {
      deploymentsCreatePage.goTo();
      e2eWorkloads.forEach(({ name, namespace }) => {
        deploymentsCreatePage.deleteWithKubectl(name, namespace);
      });
    });
  });
});
