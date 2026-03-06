import { ProjectSecretsListPagePo, ProjectSecretsCreateEditPo } from '@/cypress/e2e/po/pages/explorer/project-secrets.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

const projectSecretsListPage = new ProjectSecretsListPagePo('local');
const namespaceFilter = new NamespaceFilterPo();
const targetProject = {
  name: 'default', label: 'Default', namespace: ''
};
const projectScopedSecretName = 'e2e-project-scoped-secret-name';
const username = 'test';

describe('Project Secrets', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    cy.getRancherResource('v1', 'management.cattle.io.projects').then((resp: Cypress.Response<any>) => {
      targetProject.namespace = resp.body.data.find((item: any) => item.spec.displayName === 'Default').status.backingNamespace;
    });

    cy.intercept('POST', '/v1/secrets?exclude=metadata.managedFields').as('createProjectScopedSecret');
  });

  it('has the correct title', () => {
    projectSecretsListPage.goTo();
    projectSecretsListPage.title().should('include', 'Project Secrets');

    cy.title().should('eq', 'Rancher - local - Project Secrets');
  });

  it('creates a project-scoped secret and displays it in the list', () => {
    namespaceFilter.toggle();
    namespaceFilter.clickOptionByLabel('All Namespaces');
    namespaceFilter.closeDropdown();
    const secretCreatePage = new ProjectSecretsCreateEditPo('local');

    projectSecretsListPage.goTo();

    projectSecretsListPage.createButtonTitle().should('eq', 'Create');
    projectSecretsListPage.createButton().click();

    // create a project scoped secret
    secretCreatePage.waitForPage();
    secretCreatePage.selectSecretSubtype('kubernetes.io/basic-auth').click();
    secretCreatePage.projectSelect().toggle();
    secretCreatePage.projectSelect().clickOptionWithLabel(targetProject.label);
    secretCreatePage.nameNsDescription().name().set(projectScopedSecretName);
    secretCreatePage.basicAuthUsernameInput().set(username);
    secretCreatePage.saveOrCreate().click();

    cy.wait('@createProjectScopedSecret', { requestTimeout: 10000 }).then((req) => {
      const payload = req.request?.body;

      expect(payload.metadata.namespace).to.eq(targetProject.namespace);
      expect(payload.metadata.labels['management.cattle.io/project-scoped-secret']).to.eq(targetProject.namespace);
      expect(payload.metadata.name).to.eq(projectScopedSecretName);
    });

    cy.deleteRancherResource('v1', `secrets/${ targetProject.name }`, projectScopedSecretName, true);
    cy.deleteRancherResource('v1', `secrets/${ targetProject.namespace }`, projectScopedSecretName, true);
  });
});
