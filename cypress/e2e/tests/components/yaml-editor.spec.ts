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
    cy.createE2EResourceName('deployment').then((uniqueName) => {
      name = uniqueName;
    });

    // Create a new deployment resource
    deploymentsCreatePage.goTo();
    cy.intercept('POST', '/v1/apps.deployments').as('createDeployment');
    deploymentsCreatePage.createWithUI(name, containerImage, namespace);
    cy.wait('@createDeployment').its('response.statusCode').should('eq', 201);

    // Ensure the deployment is queryable before the tests navigate to the list, so the list's fetch
    // includes it - the steve/VAI list can omit a row that is not yet indexed, which left
    // listElementWithName unable to find the deployment's row (wedged across all retries).
    cy.waitForRancherResource('v1', 'apps.deployments', `${ namespace }/${ name }`, (resp: any) => resp?.status === 200, 30, { failOnStatusCode: false });
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
