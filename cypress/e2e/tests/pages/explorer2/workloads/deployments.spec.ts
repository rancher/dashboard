import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint, deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', { tags: ['@explorer2', '@standardUser', '@adminUser', '@flaky'] }, () => {
    let deploymentsListPage: WorkloadsDeploymentsListPagePo;
    let deploymentsCreatePage: WorkloadsDeploymentsCreatePagePo;

    // collect name/namespace of all workloads created in this test suite & delete them afterwards
    // edit deployment tests each create a workload per run to improve their retryability
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
        const name = `e2e-deployment-${ Math.random().toString(36).substr(2, 6) }`;

        deploymentCreateRequest.metadata.name = name;
        const { namespace } = deploymentCreateRequest.metadata;
        const containerImage = 'nginx';

        deploymentsCreatePage.goTo();
        deploymentsCreatePage.waitForPage();

        deploymentsCreatePage.createWithUI(name, containerImage, namespace);

        cy.wait('@createDeployment').then(({ request, response }) => {
          // comparing pod spec instead of the entire request body to avoid needing to compare labels that include the dynamic test name
          expect(request.body.spec.template.spec).to.deep.eq(deploymentCreateRequest.spec.template.spec);
          expect(response.statusCode).to.eq(201);
          expect(response.body.metadata.name).to.eq(name);
          expect(response.body.metadata.namespace).to.eq(namespace);
        });

        // Collect the name of the workload for cleanup
        e2eWorkloads.push({ name, namespace });
      });
    });

    describe('Update: Deployments', () => {
      let workloadName;
      let workloadDetailsPage;

      const { namespace } = createDeploymentBlueprint.metadata;
      let deploymentEditConfigPage;

      beforeEach(() => {
        workloadName = `e2e-deployment-${ Math.random().toString(36).substr(2, 6) }`;
        const testDeployment = { ...createDeploymentBlueprint };

        workloadDetailsPage = new WorkloadsDeploymentsDetailsPagePo(workloadName);
        deploymentEditConfigPage = new WorkloadsDeploymentsCreatePagePo();

        testDeployment.metadata.name = workloadName;
        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.createWithKubectl(createDeploymentBlueprint, undefined, MEDIUM_TIMEOUT_OPT);

        // Collect the name of the workload for cleanup
        e2eWorkloads.push({ name: workloadName, namespace });
      });

      it('Should be able to scale the number of pods', () => {
        workloadDetailsPage.goTo();
        workloadDetailsPage.waitForPage();
        workloadDetailsPage.mastheadTitle().should('contain', e2eWorkloads[1].name);
      });

      it('Should be able to view and edit configuration of pod volumes with no custom component', () => {
        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ e2eWorkloads[2].name }`).as('editDeployment');

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(e2eWorkloads[2].name);

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
        deploymentEditConfigPage.podStorage().nthVolumeComponent(0).yamlEditor().set('name: test-vol-changed\nprojected:\n    defaultMode: 420');

        // verify that the list of volumes in the container tab has updated
        deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');
        deploymentEditConfigPage.containerStorage().addVolumeButton().toggle();
        deploymentEditConfigPage.containerStorage().addVolumeButton().getOptions().should('contain', 'test-vol-changed (projected)');
        deploymentEditConfigPage.containerStorage().addVolumeButton().getOptions().should('not.contain', 'test-vol (projected)');

        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(response.statusCode).to.eq(200);
          expect(request.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed', projected: { defaultMode: 420 } });
          expect(response.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed', projected: { defaultMode: 420, sources: null } });
        });
      });

      it('should be able to add container volume mounts', () => {
        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ e2eWorkloads[3].name }`).as('editDeployment');

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(e2eWorkloads[3].name);
        deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');

        deploymentEditConfigPage.containerStorage().addVolume('test-vol1');

        deploymentEditConfigPage.containerStorage().nthVolumeMount(0).nthMountPoint(0).set('test-123');

        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
          expect(response.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
        });
      });

      it('should be able to remove container volume mounts', () => {
        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ e2eWorkloads[3].name }`).as('editDeployment');

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(e2eWorkloads[3].name);
        deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');
        deploymentEditConfigPage.containerStorage().removeVolume(0);
        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([]);
          expect(response.body.spec.template.spec.containers[0].volumeMounts).to.eq(undefined);
        });
      });
    });

    describe('List: Deployments', () => {
      it('Should list the workloads', () => {
        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        e2eWorkloads.forEach(({ name }) => {
          deploymentsListPage.listElementWithName(name).should('exist');
        });
      });
    });

    describe('Delete: Deployments', () => {
      it('Should be able to delete a workload', () => {
        const deploymentName = e2eWorkloads[0].name;

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.listElementWithName(deploymentName).should('exist');
        deploymentsListPage.deleteAndWaitForRequest(deploymentName);
        deploymentsListPage.listElementWithName(deploymentName).should('not.exist');
      });
    });

    // This is here because need to delete the workload after the test
    // But need to reuse the same workload for multiple tests
    after(() => {
      deploymentsListPage.goTo();
      deploymentsListPage.waitForPage();
      e2eWorkloads?.forEach(({ name, namespace }) => {
        deploymentsListPage.deleteWithKubectl(name, namespace);
      });
    });
  });
});
