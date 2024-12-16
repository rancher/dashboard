import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint, deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

describe('Cluster Explorer', () => {
  describe('Workloads', { tags: ['@explorer2', '@standardUser', '@adminUser'] }, () => {
    let deploymentsListPage: WorkloadsDeploymentsListPagePo;
    let deploymentsCreatePage: WorkloadsDeploymentsCreatePagePo;

    beforeEach(() => {
      cy.login();
      deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo('local');
      deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');
    });

    describe('Create: Deployments', () => {
      let deploymentId;

      before(() => {
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

          deploymentId = response.body.id;
        });
      });

      afterEach(() => {
        cy.deleteRancherResource('v1', 'apps.deployment', deploymentId);
      });
    });

    describe('Update: Deployments', () => {
      let workloadName;
      let workloadDetailsPage;
      let updatedDeploymentId;

      const { namespace } = createDeploymentBlueprint.metadata;
      let deploymentEditConfigPage;

      beforeEach(() => {
        workloadName = `e2e-deployment-${ Math.random().toString(36).substr(2, 6) }`;
        const testDeployment = { ...createDeploymentBlueprint };

        workloadDetailsPage = new WorkloadsDeploymentsDetailsPagePo(workloadName);
        deploymentEditConfigPage = new WorkloadsDeploymentsCreatePagePo();

        testDeployment.metadata.name = workloadName;

        cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(testDeployment)).then((resp: Cypress.Response<any>) => {
          updatedDeploymentId = resp.body.id;
        });
      });

      afterEach(() => {
        cy.deleteRancherResource('v1', 'apps.deployment', updatedDeploymentId);
      });

      it('Should be able to scale the number of pods', () => {
        workloadDetailsPage.goTo();
        workloadDetailsPage.waitForPage();
        workloadDetailsPage.mastheadTitle().should('contain', workloadName);
        workloadDetailsPage.podsRunningTotal().should('contain', '1');
        workloadDetailsPage.podScaleUp().click();
        workloadDetailsPage.gaugesPods().should('contain', 'Containercreating');
        workloadDetailsPage.gaugesPods().should('contain', 'Running');
        workloadDetailsPage.podsRunningTotal().should('contain', '2');
        workloadDetailsPage.podScaleDown().click();
        workloadDetailsPage.podsRunningTotal().should('contain', '1');
      });

      it('Should be able to view and edit configuration of pod volumes with no custom component', () => {
        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('editDeployment');

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(workloadName);

        // open the pod tab
        deploymentEditConfigPage.horizontalTabs().clickTabWithSelector('li#pod');

        // open the pod storage tab
        deploymentEditConfigPage.podTabs().clickTabWithSelector('li#storage-pod');

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

      it('should be able to add and remove container volume mounts', () => {
        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('editDeployment');

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(workloadName);
        deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');

        deploymentEditConfigPage.containerStorage().addVolume('test-vol1');

        deploymentEditConfigPage.containerStorage().nthVolumeMount(0).nthMountPoint(0).set('test-123');

        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
          expect(response.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
        });

        cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('editDeployment');

        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(workloadName);
        deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');
        deploymentEditConfigPage.containerStorage().removeVolume(0);
        deploymentEditConfigPage.saveCreateForm().click();

        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([]);
          expect(response.body.spec.template.spec.containers[0].volumeMounts).to.eq(undefined);
        });
      });

      it('should be able to select Pod CSI storage option', () => {
        deploymentsCreatePage.goTo();
        deploymentsCreatePage.waitForPage();

        // open the pod tab
        deploymentsCreatePage.horizontalTabs().clickTabWithSelector('li#pod');

        // open the pod storage tab
        deploymentsCreatePage.podTabs().clickTabWithSelector('li#storage-pod');

        deploymentsCreatePage.podStorage().addVolumeButton().toggle();
        deploymentsCreatePage.podStorage().addVolumeButton().getOptions().should('contain', 'CSI');

        deploymentsCreatePage.podStorage().addVolumeButton().clickOptionWithLabel('CSI');

        // open the driver input
        deploymentsCreatePage.podStorage().driverInput().toggle();
        deploymentsCreatePage.podStorage().driverInput().getOptions().should('contain', 'Longhorn');

        // select the Longhorn option from the driver input
        deploymentsCreatePage.podStorage().driverInput().clickOptionWithLabel('Longhorn');
      });
    });

    describe('List: Deployments', () => {
      let listedDeploymentName1Id;
      let listedDeploymentName2Id;

      it('Should list the workloads', () => {
        const listedWorkloadName1 = Cypress._.uniqueId(Date.now().toString());
        const listedWorkloadName2 = Cypress._.uniqueId(Date.now().toString());
        const testDeployment = { ...createDeploymentBlueprint };

        testDeployment.metadata.name = listedWorkloadName1;
        cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(testDeployment)).then((resp: Cypress.Response<any>) => {
          listedDeploymentName1Id = resp.body.id;
        });

        testDeployment.metadata.name = listedWorkloadName2;
        cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(testDeployment)).then((resp: Cypress.Response<any>) => {
          listedDeploymentName2Id = resp.body.id;
        });
        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.listElementWithName(listedWorkloadName1).should('exist');
        deploymentsListPage.listElementWithName(listedWorkloadName2).should('exist');
      });

      after(() => {
        cy.deleteRancherResource('v1', 'apps.deployment', listedDeploymentName1Id);
        cy.deleteRancherResource('v1', 'apps.deployment', listedDeploymentName2Id);
      });
    });

    describe('Delete: Deployments', () => {
      it('Should be able to delete a workload', () => {
        const workloadName = Cypress._.uniqueId(Date.now().toString());
        const testDeployment = { ...createDeploymentBlueprint };

        testDeployment.metadata.name = workloadName;
        cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(testDeployment));
        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.listElementWithName(workloadName).should('exist');
        deploymentsListPage.deleteAndWaitForRequest(workloadName);
        deploymentsListPage.listElementWithName(workloadName).should('not.exist');
      });
    });
  });
});
