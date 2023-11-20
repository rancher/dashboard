import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint, deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', { tags: ['@standardUser', '@adminUser', '@flaky'] }, () => {
    let deploymentsListPage: WorkloadsDeploymentsListPagePo;
    let deploymentsCreatePage: WorkloadsDeploymentsCreatePagePo;

    const e2eWorkloads: { name: string; namespace: string; }[] = [];

    beforeEach(() => {
      deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo('local');
      deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');
    });

    describe('Create: Deployments', () => {
      beforeEach(() => {
        cy.interceptAllRequests('POST');
      });

      it('should be able to create a new deployment with basic options', () => {
        const { name, namespace } = deploymentCreateRequest.metadata;
        const containerImage = 'nginx';

        deploymentsCreatePage.goTo();

        deploymentsCreatePage.createWithUI(name, containerImage, namespace);

        cy.wait('@interceptAllRequests0').then(({ request, response }) => {
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

      beforeEach(() => {
        cy.intercept('GET', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('testWorkload');
        cy.intercept('GET', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('clonedPod');

        deploymentsListPage.goTo();
        deploymentsListPage.createWithKubectl(createDeploymentBlueprint);

        // Collect the name of the workload for cleanup
        e2eWorkloads.push({ name: workloadName, namespace });
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
        e2eWorkloads.forEach(({ name }) => {
          deploymentsListPage.listElementWithName(name).should('exist');
        });
      });
    });

    describe('Delete: Deployments', () => {
      const deploymentName = deploymentCreateRequest.metadata.name;

      // To reduce test runtime, will use the same workload for all the tests
      it('Should be able to delete a workload', () => {
        deploymentsListPage.goTo();

        deploymentsListPage.listElementWithName(deploymentName).should('exist');
        deploymentsListPage.deleteItemWithUI(deploymentName);
        deploymentsListPage.listElementWithName(deploymentName).should('not.exist');
      });
    });

    // This is here because need to delete the workload after the test
    // But need to reuse the same workload for multiple tests
    after(() => {
      deploymentsListPage?.goTo();
      e2eWorkloads?.forEach(({ name, namespace }) => {
        deploymentsListPage.deleteWithKubectl(name, namespace);
      });
    });
  });
});
