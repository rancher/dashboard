import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';
import { deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

describe('Yaml Editor', () => {
  const deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo('local');
  const deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');

  const { name, namespace } = deploymentCreateRequest.metadata;
  const containerImage = 'nginx';

  beforeEach(() => {
    cy.login();

    // Create a new deployment resource
    deploymentsCreatePage.goTo();
    cy.intercept('POST', '/v1/apps.deployments').as('createDeployment');
    deploymentsCreatePage.createWithUI(name, containerImage, namespace);
    cy.wait('@createDeployment').its('response.statusCode').should('eq', 201);
  });

  describe('Edit mode', () => {
    it('Check if body and footer are visible to human eye', { tags: ['@components', '@adminUser'] }, () => {
      deploymentsListPage.goTo();
      deploymentsListPage.listElementWithName(name).should('exist');
      deploymentsListPage.goToEditYamlPage(name);

      const resourceYaml = new ResourceYamlPo();

      resourceYaml.body().should('be.visible').then(() => {
        resourceYaml.footer().isVisible();
      });
    });
  });

  afterEach(() => {
    // Delete the deployment
    deploymentsListPage.goTo();
    deploymentsListPage.deleteItemWithUI(name);
  });
});
