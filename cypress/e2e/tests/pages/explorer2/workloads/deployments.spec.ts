import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint, deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', { tags: ['@explorer2', '@standardUser', '@adminUser', '@flaky'] }, () => {
    let deploymentsListPage: WorkloadsDeploymentsListPagePo;
    let deploymentsCreatePage: WorkloadsDeploymentsCreatePagePo;

    const e2eWorkloads: { name: string; namespace: string; }[] = [];

    beforeEach(() => {
      deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo('local');
      deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');
    });

    describe.skip('Create: Deployments', () => {
      beforeEach(() => {
        cy.intercept('POST', '/v1/apps.deployments').as('createDeployment');
      });

      it('should be able to create a new deployment with basic options', () => {
        const { name, namespace } = deploymentCreateRequest.metadata;
        const containerImage = 'nginx';

        deploymentsCreatePage.goTo();

        deploymentsCreatePage.createWithUI(name, containerImage, namespace);

        cy.wait('@createDeployment').then(({ request, response }) => {
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
        deploymentsListPage.goTo();
        deploymentsListPage.createWithKubectl(createDeploymentBlueprint);

        // Collect the name of the workload for cleanup
        e2eWorkloads.push({ name: workloadName, namespace });
      });

      it.skip('Should be able to scale the number of pods', () => {
        workloadDetailsPage.goTo();
        workloadDetailsPage.mastheadTitle().should('contain', workloadName);
      });

      it('Should be able to view and edit configuration of volumes with no custom component', () => {
        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('editDeployment');
        deploymentsListPage.goTo();
        deploymentsListPage.goToEditConfigPage(workloadName);

        const deploymentEditConfigPage = new WorkloadsDeploymentsCreatePagePo();

        // open the pod tab
        deploymentEditConfigPage.horizontalTabs().clickTabWithSelector('li#pod');

        // open the pod storage tab
        deploymentEditConfigPage.podTabs().clickTabWithSelector('li#storage');

        // check that there is a component rendered for each workload volume and that that component has rendered some information about the volume
        deploymentEditConfigPage.podStorage().nthVolumeComponent(0).yamlEditor().value()
          .should('contain', 'name: test-vol');
        deploymentEditConfigPage.podStorage().nthVolumeComponent(1).yamlEditor().value()
          .should('contain', 'name: test-vol1');

        // now try editing
        deploymentEditConfigPage.podStorage().nthVolumeComponent(0).yamlEditor().set('name: test-vol-changed');

        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request }) => {
          expect(request.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed' });
        });
      });

      afterEach(() => {
        cy.login();

        deploymentsListPage?.goTo();
        e2eWorkloads?.forEach(({ name, namespace }) => {
          deploymentsListPage.deleteWithKubectl(name, namespace);
        });
      });
    });

    describe.skip('List: Deployments', () => {
      // To reduce test runtime, will use the same workload for all the tests
      it('Should list the workloads', () => {
        deploymentsListPage.goTo();
        e2eWorkloads.forEach(({ name }) => {
          deploymentsListPage.listElementWithName(name).should('exist');
        });
      });
    });

    describe.skip('Delete: Deployments', () => {
      const deploymentName = deploymentCreateRequest.metadata.name;

      // To reduce test runtime, will use the same workload for all the tests
      it('Should be able to delete a workload', () => {
        deploymentsListPage.goTo();

        deploymentsListPage.listElementWithName(deploymentName).should('exist');
        deploymentsListPage.deleteItemWithUI(deploymentName);
        deploymentsListPage.listElementWithName(deploymentName).should('not.exist');
      });
    });

    // TODO nb fix shitty retry logic
    // This is here because need to delete the workload after the test
    // But need to reuse the same workload for multiple tests
    // after(() => {
    //   deploymentsListPage?.goTo();
    //   e2eWorkloads?.forEach(({ name, namespace }) => {
    //     deploymentsListPage.deleteWithKubectl(name, namespace);
    //   });
    // });
  });
});
