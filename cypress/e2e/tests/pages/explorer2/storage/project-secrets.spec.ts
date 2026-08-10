import { ProjectSecretsListPagePo, ProjectSecretsCreateEditPo } from '@/cypress/e2e/po/pages/explorer/project-secrets.po';
import { qase } from '@/cypress/support/qase';

const clusterId = 'local';
const projectSecretsListPage = new ProjectSecretsListPagePo(clusterId);
const targetProject = {
  name: 'default', label: 'Default', namespace: ''
};
let projectScopedSecretName = '';
let removeProjectScopedSecret = false;
const username = 'test';
const password = 'test-password';

describe('Project Secrets', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    cy.createE2EResourceName('project-scoped-secret').then((name) => {
      projectScopedSecretName = name;
    });

    cy.getRancherResource('v1', 'management.cattle.io.projects').then((resp: Cypress.Response<any>) => {
      // Scope by clusterName in addition to displayName: multiple clusters can each have their
      // own "Default" project, and an unscoped find() can resolve to the wrong cluster's project
      // (mismatching the namespace the UI actually uses for the "local" cluster's secret).
      const project = resp.body.data.find((item: any) => item.spec.displayName === targetProject.label && item.spec.clusterName === clusterId);

      // eslint-disable-next-line no-unused-expressions
      expect(project, `project "${ targetProject.label }" in cluster "${ clusterId }"`).to.exist;
      targetProject.namespace = project.status.backingNamespace;
    });

    cy.intercept('POST', '/v1/secrets?exclude=metadata.managedFields').as('createProjectScopedSecret');
  });

  qase(24277, it('has the correct title', () => {
    projectSecretsListPage.goTo();
    projectSecretsListPage.title().should('include', 'Project Secrets');

    cy.title().should('eq', 'Rancher - local - Project Secrets');
  }));

  qase(27179, it('creates a project-scoped secret and displays it in the list', () => {
    cy.updateNamespaceFilter('local', 'none', '{"local":[]}');

    const secretCreatePage = new ProjectSecretsCreateEditPo(clusterId);

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
    secretCreatePage.basicAuthPasswordInput().set(password, true);
    secretCreatePage.saveOrCreate().click();

    cy.wait('@createProjectScopedSecret', { requestTimeout: 10000 }).then((req) => {
      const payload = req.request?.body;

      expect(req.response?.statusCode).to.eq(201);
      removeProjectScopedSecret = true;
      expect(payload.metadata.namespace).to.eq(targetProject.namespace);
      expect(payload.metadata.labels['management.cattle.io/project-scoped-secret']).to.eq(targetProject.namespace);
      expect(payload.metadata.name).to.eq(projectScopedSecretName);
    });
  }));

  afterEach(() => {
    if (removeProjectScopedSecret) {
      cy.deleteRancherResource('v1', `secrets/${ targetProject.name }`, projectScopedSecretName, false);
      cy.deleteRancherResource('v1', `secrets/${ targetProject.namespace }`, projectScopedSecretName, false);
    }

    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
