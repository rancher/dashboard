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

  describe('Custom resource quota type', () => {
    it('identifier input is disabled when a non-custom resource type is selected', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();
      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.selectResourceTypeByLabel('Config Maps');
      createProjectPage.inputCustomType().expectToBeDisabled();
    });

    it('identifier input is enabled when the Custom resource type is selected', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();
      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.selectResourceTypeByLabel('Custom');
      createProjectPage.inputCustomType().expectToBeEnabled();
    });

    it('Create button is disabled with Custom type selected but no identifier provided', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();
      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.resourceDetail().createEditView()
        .createButton()
        .expectToBeDisabled();
    });

    it('Create button is enabled after providing the resource identifier', () => {
      projectsNamespacesPage.baseResourceList().masthead().create();
      createProjectPage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set('test-1234');
      createProjectPage.tabResourceQuotas().click();
      createProjectPage.btnAddResource().click();
      createProjectPage.inputCustomType().set('example.io/custom-resource');
      createProjectPage.resourceDetail().createEditView()
        .createButton()
        .expectToBeEnabled();
    });

    describe('stores correct quota values for Custom type', () => {
      beforeEach(() => {
        cy.createE2EResourceName('proj').as('projectName');
        cy.intercept('POST', '/v3/projects').as('createProjectRequest');
      });

      it('correctly stores Project Limit and Namespace Default Limit for Custom type', () => {
        cy.get('@projectName').then((projectName) => {
          projectsNamespacesPage.baseResourceList().masthead().create();
          createProjectPage.resourceDetail().createEditView().nameNsDescription()
            .name()
            .set(projectName);
          createProjectPage.tabResourceQuotas().click();
          createProjectPage.btnAddResource().click();
          createProjectPage.inputCustomType().set('example.io/custom-resource');
          createProjectPage.inputProjectLimit().set('5');
          createProjectPage.inputNamespaceDefaultLimit().set('2');
          createProjectPage.resourceDetail().createEditView().create();

          cy.wait('@createProjectRequest').then(({ request }) => {
            expect(request.body.resourceQuota.limit.extended['example.io/custom-resource']).to.equal('5');
            expect(request.body.namespaceDefaultResourceQuota.limit.extended['example.io/custom-resource']).to.equal('2');
          });
        });
      });

      it('sends only the last-written quota values when duplicate custom resource identifiers are posted', () => {
        cy.get('@projectName').then((projectName) => {
          projectsNamespacesPage.baseResourceList().masthead().create();
          createProjectPage.resourceDetail().createEditView().nameNsDescription()
            .name()
            .set(projectName);
          createProjectPage.tabResourceQuotas().click();

          // Add first Custom resource row
          createProjectPage.btnAddResource().click();
          createProjectPage.selectResourceTypeByLabel('Custom', 0);
          createProjectPage.inputCustomType(0).set('example.io/custom-resource');
          createProjectPage.inputProjectLimit(0).set('5');
          createProjectPage.inputNamespaceDefaultLimit(0).set('2');

          // Add second Custom resource row with the same identifier
          createProjectPage.btnAddResource().click();
          createProjectPage.selectResourceTypeByLabel('Custom', 1);
          createProjectPage.inputCustomType(1).set('example.io/custom-resource');
          createProjectPage.inputProjectLimit(1).set('10');
          createProjectPage.inputNamespaceDefaultLimit(1).set('4');

          createProjectPage.resourceDetail().createEditView().create();

          cy.wait('@createProjectRequest').then(({ request }) => {
            // The duplicate identifier resolves to a single key; the last-written values win
            expect(request.body.resourceQuota.limit.extended['example.io/custom-resource']).to.equal('10');
            expect(request.body.namespaceDefaultResourceQuota.limit.extended['example.io/custom-resource']).to.equal('4');
          });
        });
      });

      it('sends a POST request without extended quota values when identifier is set but quota values are left empty', () => {
        cy.get('@projectName').then((projectName) => {
          projectsNamespacesPage.baseResourceList().masthead().create();
          createProjectPage.resourceDetail().createEditView().nameNsDescription()
            .name()
            .set(projectName);
          createProjectPage.tabResourceQuotas().click();

          // Add a Custom resource row with only the identifier filled in; leave both limit fields empty
          createProjectPage.btnAddResource().click();
          createProjectPage.selectResourceTypeByLabel('Custom', 0);
          createProjectPage.inputCustomType(0).set('example.io/custom-resource');

          createProjectPage.resourceDetail().createEditView().create();

          cy.wait('@createProjectRequest').then(({ request }) => {
            // No limit values were entered so the extended object is absent from the request body
            expect(request.body.resourceQuota.limit?.extended).to.equal(undefined);
            expect(request.body.namespaceDefaultResourceQuota.limit?.extended).to.equal(undefined);
          });
        });
      });

      afterEach(() => {
        cy.get<string>('@projectName').then((projectName) => {
          cy.deleteRancherResource('v3', 'projects', projectName, false);
        });
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
      createProjectPage.selectResourceType(1);
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
      createProjectPage.selectResourceType(1);
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
      createProjectPage.selectResourceType(1);
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
      cy.getRancherResource('v1', 'ext.cattle.io.selfuser').then((resp: Cypress.Response<any>) => {
        const userId = resp.body.status.userID;
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
