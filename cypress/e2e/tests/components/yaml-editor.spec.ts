import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';
import { deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';
import { qase } from '@/cypress/support/qase';

describe('Yaml Editor', { tags: ['@components', '@adminUser', '@standardUser'] }, () => {
  const deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo('local');
  const deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');

  let { name, namespace } = deploymentCreateRequest.metadata;

  const containerImage = 'nginx';

  beforeEach(() => {
    cy.login();
    cy.viewport(1280, 720);

    // Everything below must run inside the `.then`: `name` is only assigned when the command queue
    // runs, so reading it at queue time (as `createWithUI(name, ...)` did) captured the blueprint's
    // 'test-deployment' instead, and the test then looked for a row that was never created.
    cy.createE2EResourceName('deployment').then((uniqueName) => {
      name = uniqueName;

      // The generated name is stable for the whole run, so a leftover from a failed attempt would 409
      // the create below. Remove it and wait for it to actually go away.
      cy.deleteRancherResource('v1', 'apps.deployments', `${ namespace }/${ name }`, false);
      cy.waitForRancherResource('v1', 'apps.deployments', `${ namespace }/${ name }`, (resp: any) => resp?.status === 404, 30, { failOnStatusCode: false });

      // Create a new deployment resource
      deploymentsCreatePage.goTo();
      cy.intercept('POST', '/v1/apps.deployments').as('createDeployment');
      deploymentsCreatePage.createWithUI(name, containerImage, namespace);
      cy.wait('@createDeployment').its('response.statusCode').should('eq', 201);
    });
  });

  describe('Edit mode', () => {
    qase(2460, it('Check if body and footer are visible to human eye', { tags: ['@components', '@adminUser'] }, () => {
      deploymentsListPage.goTo();
      deploymentsListPage.listElementWithName(name).should('exist');
      deploymentsListPage.goToEditYamlPage(name);

      const resourceYaml = new ResourceYamlPo();

      resourceYaml.body().should('be.visible').then(() => {
        resourceYaml.footer().isVisible();
      });
    }));
  });

  afterEach(() => {
    // Delete the deployment
    deploymentsListPage.goTo();
    deploymentsListPage.deleteItemWithUI(name);
  });
});
