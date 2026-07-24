import { createPodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import WorkloadPagePo from '@/cypress/e2e/po/pages/explorer/workloads.po';
import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';
import NodeSchedulingPo from '@/cypress/e2e/po/components/workloads/node-scheduling.po';
import { qase } from '@/cypress/support/qase';

describe('Workloads', { tags: ['@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Pod creation', () => {
    let podId: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('pod').then((name) => {
        podId = name;

        // Clean up leftover from a previous run and wait until fully gone
        cy.deleteRancherResource('v1', 'pods', `default/${ podId }`, false);
        cy.waitForRancherResource('v1', 'pods', `default/${ podId }`, (resp: any) => resp.status === 404, 20, { failOnStatusCode: false });

        const podBlueprint: any = structuredClone(createPodBlueprint);

        podBlueprint.metadata.name = podId;

        // Create pod via API — deterministic and faster than kubectl terminal
        cy.createRancherResource('v1', 'pods', JSON.stringify(podBlueprint));

        // Poll API until pod exists before checking the UI table
        cy.waitForRancherResource('v1', 'pods', `default/${ podId }`, (resp: any) => resp.status === 200);
      });
    });

    after(() => {
      if (podId) {
        cy.deleteRancherResource('v1', 'pods', `default/${ podId }`, false);
      }
    });

    qase(1403, it('creating a simple pod should appear on the workloads list page', () => {
      // Navigate to Pods list page and click through to details
      const podsListPage = new WorkloadsPodsListPagePo('local');

      podsListPage.goTo();
      podsListPage.waitForPage();
      podsListPage.goToDetailsPage(podId);

      // Assert detail page shows pod name — https://github.com/rancher/dashboard/issues/10490
      const podDetailsPage = new WorkLoadsPodDetailsPagePo(podId);

      podDetailsPage.mastheadTitle().should('contain', podId);
    }));
  });
  qase(5538, it('Validation errors should not be shown when form is just opened', () => {
    const workload = new WorkloadPagePo('local');

    workload.goTo();
    workload.clickCreate();
    workload.createWorkloadsForm().errorBanner().should('not.exist');
  }));

  // https://github.com/rancher/dashboard/issues/16092
  describe('Node Scheduling', () => {
    const deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');
    const deploymentEditConfigPage = new WorkloadsDeploymentsCreatePagePo('local');

    let nodeSchedulingDeploymentId: string;

    after(() => {
      if (nodeSchedulingDeploymentId) {
        cy.deleteRancherResource('v1', 'apps.deployment', `default/${ nodeSchedulingDeploymentId }`, false);
      }
    });

    qase(48753, it('should clear nodeName when switching node scheduling back to any node', () => {
      // Create a deployment that already has nodeName set (simulating "Run pods on specific nodes")
      cy.createE2EResourceName('node-sched').then((name) => {
        nodeSchedulingDeploymentId = name;

        // Clean up any leftover from a previous retry
        cy.deleteRancherResource('v1', 'apps.deployment', `default/${ nodeSchedulingDeploymentId }`, false);

        const deployment: any = structuredClone(createDeploymentBlueprint);

        deployment.metadata.name = nodeSchedulingDeploymentId;
        deployment.spec.template.spec.nodeName = 'some-node';

        cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(deployment));

        // Navigate to the deployments list and edit the deployment
        deploymentsListPage.goTo();
        deploymentsListPage.waitForPage();
        deploymentsListPage.goToEditConfigPage(nodeSchedulingDeploymentId);

        // Navigate to Pod tab > Node Scheduling tab
        deploymentEditConfigPage.horizontalTabs().clickTabWithSelector('li#pod');
        deploymentEditConfigPage.podTabs().clickTabWithSelector('li#nodeScheduling-pod');

        const nodeScheduling = new NodeSchedulingPo();

        // The radio group should currently be on "Run pods on specific nodes"
        nodeScheduling.isSpecificNodeChecked();

        // Switch back to "Run pods on any available node"
        nodeScheduling.selectAnyNode();

        // The node selector dropdown should disappear when switching to "any node"
        nodeScheduling.nodeSelectorNotExist();

        // Intercept the PUT request and save
        cy.intercept('PUT', `/v1/apps.deployments/default/${ nodeSchedulingDeploymentId }`).as('editDeployment');
        deploymentEditConfigPage.resourceDetail().cruResource().saveOrCreate().click();

        // Verify nodeName is cleared from the request body
        cy.wait('@editDeployment').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(request.body.spec.template.spec).to.not.have.property('nodeName');
        });
      });
    }));
  });
});
