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
  });

  describe('Edit mode', () => {
    it('Check if body and footer are visible to human eye', { tags: ['@components', '@adminUser'] }, () => {
      // Create a new resource
      deploymentsCreatePage.goTo();
      deploymentsCreatePage.createWithUI(name, containerImage, namespace);

      // Open the YAML editor
      deploymentsListPage.goTo();
      deploymentsListPage.listElementWithName('test-deployment').should('exist');
      deploymentsListPage.goToEditYamlPage('test-deployment');

      const resourceYaml = new ResourceYamlPo();

      resourceYaml.body().should('be.visible').then(() => {
        resourceYaml.footer().isVisible();
      });
    });
  });
});
