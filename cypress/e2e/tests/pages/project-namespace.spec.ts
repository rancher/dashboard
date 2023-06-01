import projectsNamespacesePo from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';


describe('Projects/Namespaces', () => {
  const projectsNamespacesesPage = new projectsNamespacesePo('local');

  beforeEach(() => {
    cy.login();

    projectsNamespacesesPage.goTo();
  });

  it('flat list view should have create tNamespace button', () => {
    projectsNamespacesesPage.flatListClick();
    projectsNamespacesesPage.createProjectNamespaceButton().should('exist');
  })

  it('create screen should have a dropdown of projects.', () => {
    projectsNamespacesesPage.createProjectNamespaceClick();
    projectsNamespacesesPage.nsProject().should('exist');
  })
});
