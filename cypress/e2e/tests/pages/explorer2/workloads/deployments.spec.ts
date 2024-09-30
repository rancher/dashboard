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

    describe('Create: Deployments', () => {
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
      let deploymentEditConfigPage;

      beforeEach(() => {
        deploymentsListPage.goTo();
        deploymentsListPage.createWithKubectl(createDeploymentBlueprint);

        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('editDeployment');
        deploymentsListPage.goTo();
        deploymentsListPage.goToEditConfigPage(workloadName);
        deploymentEditConfigPage = new WorkloadsDeploymentsCreatePagePo();
        // Collect the name of the workload for cleanup
        e2eWorkloads.push({ name: workloadName, namespace });
      });

      it('Should be able to scale the number of pods', () => {
        workloadDetailsPage.goTo();
        workloadDetailsPage.mastheadTitle().should('contain', workloadName);
      });

      it('Should be able to view and edit configuration of pod volumes with no custom component', () => {
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

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(request.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed' });
          expect(response.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed' });
        });
      });

      it('should be able to add container volume mounts', () => {
        // select storage tab in first container tab
        deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');

        deploymentEditConfigPage.containerStorage().addVolume('test-vol1');

        deploymentEditConfigPage.containerStorage().nthVolumeMount(0).nthMountPoint(0).set('test-123');
        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
          expect(response.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
        });
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
