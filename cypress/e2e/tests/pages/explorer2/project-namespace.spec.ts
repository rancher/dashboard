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

  // Test for issue https://github.com/rancher/dashboard/issues/15336
  // Filter in Project/Namespace is not working correctly if there are projects with the same name
  describe('Filtering projects with same name in groupBy list view', () => {
    const projectName = 'samename';
    const projectIds: string[] = [];
    const namespaceNames: string[] = [];

    before(() => {
      cy.login();

      // Get current user and cluster info
      cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
        const userId = resp.body.data[0].id.trim();
        const clusterId = 'local';

        // Create 3 projects with the same name using the API
        // The API allows duplicate project names, even though the UI might not
        for (let i = 0; i < 3; i++) {
          cy.createProject(projectName, clusterId, userId).then((projectResp: Cypress.Response<any>) => {
            const projectId = projectResp.body.id.trim();

            projectIds.push(projectId);

            // Create namespace in first two projects only
            if (i < 2) {
              const nsName = `test${ i + 1 }`;

              namespaceNames.push(nsName);
              cy.createNamespaceInProject(nsName, projectId);
            }
          });
        }
      });
    });

    beforeEach(() => {
      cy.login();

      // Set up intercepts for the data requests
      cy.intercept('GET', '/v1/namespaces?*').as('getNamespaces');
      cy.intercept('GET', '/v1/management.cattle.io.projects?*').as('getProjects');

      projectsNamespacesPage.goTo();
      projectsNamespacesPage.waitForPage();

      // Wait for the resources to load
      cy.wait('@getNamespaces', { timeout: 20000 });
      cy.wait('@getProjects', { timeout: 20000 });
    });

    it('should show all projects with same name when filtering in Group by Project view', () => {
      // Switch to Group by Project view
      projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      // Filter by the project name
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .filter(projectName);

      // All 3 projects should be visible
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .groupElementsWithName(projectName)
        .should('have.length', 3);

      // The two namespaces should also be visible
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .rowElementWithName(namespaceNames[0])
        .should('exist');
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .rowElementWithName(namespaceNames[1])
        .should('exist');
    });

    it('should show projects without namespaces when filtering in Group by Project view', () => {
      // Switch to Group by Project view
      projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      // Filter by the project name
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .filter(projectName);

      // All 3 project groups should be visible (including the one without namespaces)
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .groupElementsWithName(projectName)
        .should('have.length', 3);
    });

    it('should show projects with namespaces when filtering in flat list view', () => {
      // Switch to flat list view
      projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(0)
        .click();

      // Filter by the project name
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .filter(projectName);

      // The two namespaces should be visible
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .rowElementWithName(namespaceNames[0])
        .should('exist');
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .rowElementWithName(namespaceNames[1])
        .should('exist');
    });

    after(() => {
      // Clean up: delete namespaces first, then projects
      namespaceNames.forEach((nsName) => {
        cy.deleteRancherResource('v1', 'namespaces', nsName, false);
      });

      projectIds.forEach((projectId) => {
        cy.deleteRancherResource('v3', 'projects', projectId, false);
      });
    });
  });
});
