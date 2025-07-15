// import { SecretsListPagePo, SecretsCreateEditPo } from '@/cypress/e2e/po/pages/explorer/secrets.po';
// import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

// const secretsListPage = new SecretsListPagePo('local');
// const namespaceFilter = new NamespaceFilterPo();
// const projectScopedTabName = 'project-scoped';
// const targetProject = {
//   name: 'default', label: 'Default', namespace: ''
// };
// const projectScopedSecretName = 'e2e-project-scoped-secret-name';
// const username = 'test';

describe('Secrets', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  it('skipped - see https://github.com/rancher/dashboard/issues/14773', () => {});
});

// https://github.com/rancher/dashboard/issues/14773
// describe('Secrets', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
//   beforeEach(() => {
//     cy.login();

//     cy.getRancherResource('v1', 'management.cattle.io.projects').then((resp: Cypress.Response<any>) => {
//       targetProject.namespace = resp.body.data.find((item: any) => item.spec.displayName === 'Default').status.backingNamespace;
//     });

//     cy.intercept('POST', '/k8s/clusters/local/v1/secrets').as('createProjectScopedSecret');
//   });

//   it('has the correct title', () => {
//     secretsListPage.goTo();
//     secretsListPage.title().should('include', 'Secrets');

//     cy.title().should('eq', 'Rancher - local - Secrets');
//   });

//   it('creates a project-scoped secret and displays it in the list', () => {
//     namespaceFilter.toggle();
//     namespaceFilter.clickOptionByLabel('All Namespaces');
//     namespaceFilter.closeDropdown();
//     const secretCreatePage = new SecretsCreateEditPo('local');

//     secretsListPage.goTo();
//     // check default create button title
//     secretsListPage.createButtonTitle().should('eq', 'Create Namespaced Secret');
//     // check title of create button for project scoped secret
//     secretsListPage.clickTab(projectScopedTabName);
//     secretsListPage.createButtonTitle().should('eq', 'Create Project Scoped Secret');
//     secretsListPage.createButton().click();
//     // create a project scoped secret
//     secretCreatePage.waitForPage();
//     secretCreatePage.selectSecretSubtype('kubernetes.io/basic-auth').click();
//     secretCreatePage.projectSelect().toggle();
//     secretCreatePage.projectSelect().clickOptionWithLabel(targetProject.label);
//     secretCreatePage.nameNsDescription().name().set(projectScopedSecretName);
//     secretCreatePage.basicAuthUsernameInput().set(username);
//     secretCreatePage.saveOrCreate().click();
//     cy.wait('@createProjectScopedSecret', { requestTimeout: 10000 }).then((req) => {
//       const payload = req.request?.body;

//       expect(payload.metadata.namespace).to.eq(targetProject.namespace);
//       expect(payload.metadata.labels['management.cattle.io/project-scoped-secret']).to.eq(targetProject.namespace);
//       expect(payload.metadata.name).to.eq(projectScopedSecretName);
//     });

//     cy.deleteRancherResource('v1', `secrets/${ targetProject.name }`, projectScopedSecretName, true);
//     cy.deleteRancherResource('v1', `secrets/${ targetProject.namespace }`, projectScopedSecretName, true);
//   });
// });
