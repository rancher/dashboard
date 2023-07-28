import projectsNamespacesePo from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';

describe('Projects/Namespaces', { tags: '@adminUser' }, () => {
  const projectsNamespacesesPage = new projectsNamespacesePo('local');

  beforeEach(() => {
    cy.login();

    projectsNamespacesesPage.goTo();
  });

  it('flat list view should have create Namespace button', () => {
    projectsNamespacesesPage.flatListClick();
    projectsNamespacesesPage.createProjectNamespaceButton().should('exist');
  });

  it('create namespace screen should have a projects dropdown', () => {
    projectsNamespacesesPage.createProjectNamespaceClick();
    projectsNamespacesesPage.nsProject().should('exist');
  });
});
