import { ProjectsNamespacesListPagePo, NamespaceCreateEditPagePo, ProjectCreateEditPagePo } from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';
import { spoofThirdPartyPrincipal } from '@/cypress/e2e/blueprints/explorer/rbac/third-party-principals-get';

describe('Projects/Namespaces', { tags: ['@explorer2', '@adminUser'] }, () => {
  const projectsNamespacesPage = new ProjectsNamespacesListPagePo();
  const createProjectPage = new ProjectCreateEditPagePo();
  const createNamespacePage = new NamespaceCreateEditPagePo();

  beforeEach(() => {
    cy.login();

    projectsNamespacesPage.goTo();
  });

  it('flat list view should have create Namespace button', () => {
    projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(0)
      .click();
    projectsNamespacesPage.createNamespaceButton().should('exist');
    projectsNamespacesPage.baseResourceList().masthead().actions().contains('Create Project')
      .should('exist');
  });

  it('create namespace screen should have a projects dropdown', () => {
    projectsNamespacesPage.createNamespaceButton().click();
    createNamespacePage.resourceDetail().createEditView().nameNsDescription()
      .project()
      .checkExists();
  });

  describe('Project creation', () => {
    beforeEach(() => {
      cy.createE2EResourceName('proj').as('projectName');
      cy.intercept('POST', '/v3/projects').as('createProjectRequest');
    });

    it('sets the creator principal id annotation when creating a project and using third-party auth', () => {
      cy.get('@projectName').then((projectName) => {
        // intercept the request to /v3/principals and return a principal authenticated by github instead of local
        spoofThirdPartyPrincipal();

        projectsNamespacesPage.baseResourceList().masthead().create();
        createProjectPage.resourceDetail().createEditView().nameNsDescription()
          .name()
          .set(projectName);
        createProjectPage.resourceDetail().createEditView()
          .create();

        cy.wait('@createProjectRequest').then(({ request }) => {
          expect(request.body.annotations['field.cattle.io/creator-principal-name']).to.equal('github://1234567890');
        });
      });
    });

    it('does not set a creator principal id annotation when creating a project if using local auth', () => {
      cy.get('@projectName').then((projectName) => {
        projectsNamespacesPage.baseResourceList().masthead().create();
        createProjectPage.resourceDetail().createEditView().nameNsDescription()
          .name()
          .set(projectName);
        createProjectPage.resourceDetail().createEditView()
          .create();

        cy.wait('@createProjectRequest').then(({ request, response }) => {
          expect(request.body.annotations).to.not.have.property('field.cattle.io/creator-principal-name');
          expect(response.body.annotations).to.not.have.property('field.cattle.io/creator-principal-name');
        });
      });
    });

    afterEach(() => {
      cy.get<string>('@projectName').then((projectName) => {
        cy.deleteRancherResource('v3', 'projects', projectName, false);
      });
    });
  });

  describe('Project Error Banner and Validation', () => {
    beforeEach(() => {
      projectsNamespacesPage.goTo();
    });

    // Issue 5975: create button should be disabled unless name is filled in
    it('Create button becomes available if the name is filled in', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();
      createProjectPage.resourceDetail().createEditView()
        .createButton()
        .expectToBeDisabled();
      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.resourceDetail().createEditView()
        .createButton()
        .expectToBeEnabled();
    });

    it('displays an error message when submitting a form with errors', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();

      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.inputProjectLimit().set('50');
      createProjectPage.resourceDetail().createEditView()
        .create();

      createProjectPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      createProjectPage.bannerError(0).should('have.length', 1);
    });

    it('displays a single error message on repeat submissions of a form with errors', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();

      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.inputProjectLimit().set('50');
      createProjectPage.resourceDetail().createEditView()
        .create();

      createProjectPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      createProjectPage.bannerError(0).should('have.length', 1);

      createProjectPage.resourceDetail().createEditView()
        .create();

      createProjectPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      createProjectPage.bannerError(0).should('have.length', 1);
      createProjectPage.bannerError(1).should('have.length', 0);
    });

    // testing https://github.com/rancher/dashboard/issues/11881
    it('displays the most recent error after resolving a single error in a form with multiple errors', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();

      // Create the first error
      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.inputProjectLimit().set('50');
      createProjectPage.resourceDetail().createEditView()
        .create();

      // Create a second error
      createProjectPage.tabContainerDefaultResourceLimit().click();
      createProjectPage.inputCpuReservation().set('1000');
      createProjectPage.inputMemoryReservation().set('128');
      createProjectPage.inputCpuLimit().set('200');
      createProjectPage.inputMemoryLimit().set('64');
      createProjectPage.resourceDetail().createEditView()
        .create();

      // Assert that there is only a single error message
      createProjectPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      createProjectPage.bannerError(0).should('have.length', 1);
      createProjectPage.bannerError(1).should('have.length', 0);

      // resolve the first error
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.inputNamespaceDefaultLimit().set('50');
      createProjectPage.resourceDetail().createEditView()
        .create();

      // Click on Create again and assert that there is only a single error
      createProjectPage.bannerError(0).should('be.visible').contains('admission webhook "rancher.cattle.io.projects.management.cattle.io" denied the request');
      createProjectPage.bannerError(0).should('have.length', 1);
      createProjectPage.bannerError(1).should('have.length', 0);
    });
  });
});
