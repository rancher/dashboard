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
  });

  describe('Edit mode', () => {
    qase(2460, it('Check if body and footer are visible to human eye', { tags: ['@components', '@adminUser'] }, () => {
      deploymentsListPage.goTo();
      deploymentsListPage.listElementWithName(name).should('exist');
      deploymentsListPage.goToEditYamlPage(name);

      const resourceYaml = new ResourceYamlPo();

      // `footer().isVisible()` is a one-shot viewport-position check (reads getBoundingClientRect()
      // synchronously, no retry). Gate it behind a retry-able `.should('be.visible')` on both the
      // body and the footer so the codemirror editor has finished laying out before we measure —
      // firing the measurement from inside a `.then()` the moment the body appears races the layout
      // and flakes. (Only the footer is viewport-measured; the body can legitimately be taller than
      // the viewport, so it just needs to be rendered/visible.)
      resourceYaml.body().should('be.visible');
      resourceYaml.footer().should('be.visible').isVisible();
    }));
  });

  afterEach(() => {
    // Delete the deployment
    deploymentsListPage.goTo();
    deploymentsListPage.deleteItemWithUI(name);
  });
});
