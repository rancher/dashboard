import { ProjectsNamespacesListPagePo } from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';

/**
 * Tests for issue https://github.com/rancher/dashboard/issues/10094
 *
 * Verifies that namespace creation permissions are enforced per-project based on the
 * user's actual role in each project, rather than being globally shown/hidden.
 */
describe('Namespace creation permissions per project', { tags: ['@explorer2', '@standardUser'] }, () => {
  const projectsNamespacesPage = new ProjectsNamespacesListPagePo();

  const projectWithAccess = 'ns-perm-member';
  const projectWithoutAccess = 'ns-perm-readonly';

  let projectWithAccessId: string;
  let projectWithoutAccessId: string;
  let standardUsername: string;

  before(() => {
    cy.login();

    cy.getRancherResource('v1', 'ext.cattle.io.selfuser').then((resp: Cypress.Response<any>) => {
      const adminUserId = resp.body.status.userID;
      const clusterId = 'local';

      // Create the two projects
      cy.createProject(projectWithAccess, clusterId, adminUserId).then((projectResp: Cypress.Response<any>) => {
        projectWithAccessId = projectResp.body.id.trim();

        cy.createProject(projectWithoutAccess, clusterId, adminUserId).then((projectResp2: Cypress.Response<any>) => {
          projectWithoutAccessId = projectResp2.body.id.trim();

          // Create a standard user with project-member on one project, read-only on the other
          cy.createUser({
            username:    'ns-perm-user',
            globalRole:  { role: 'user' },
            projectRole: {
              clusterId,
              projectName: projectWithAccess,
              role:        'project-member',
            },
          }).then((userResp: Cypress.Response<any>) => {
            standardUsername = userResp.body.username;

            // Get the user's principalId and add read-only to the second project
            cy.getRancherResource('v1', 'management.cattle.io.users', userResp.body.id).then((userData) => {
              const userPrincipalId = userData.body.principalIds[0];

              cy.setProjectRoleBinding(clusterId, userPrincipalId, projectWithoutAccess, 'read-only');
            });
          });
        });
      });
    });
  });

  describe('Projects/Namespaces list page', () => {
    beforeEach(() => {
      cy.login(standardUsername, Cypress.env('password'));

      cy.intercept('GET', '/v1/namespaces?*').as('getNamespaces');
      cy.intercept('GET', '/v1/management.cattle.io.projects?*').as('getProjects');

      projectsNamespacesPage.goTo();
      projectsNamespacesPage.waitForPage();

      cy.wait('@getNamespaces', { timeout: 20000 });
      cy.wait('@getProjects', { timeout: 20000 });

      // Switch to Group by Project view
      projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();
    });

    it('shows "Create Namespace" button for project where user is project-member', () => {
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .groupElementsWithName(projectWithAccess)
        .should('have.length', 1)
        .find('.create-namespace')
        .should('exist');
    });

    it('does not show "Create Namespace" button for project where user is read-only', () => {
      projectsNamespacesPage.list().resourceTable().sortableTable()
        .groupElementsWithName(projectWithoutAccess)
        .should('have.length', 1)
        .find('.create-namespace')
        .should('not.exist');
    });
  });

  describe('Namespace create page project dropdown', () => {
    beforeEach(() => {
      cy.login(standardUsername, Cypress.env('password'));

      cy.intercept('GET', '/v1/management.cattle.io.projects?*').as('getProjects');

      // Navigate directly to the namespace create page with flatView=true to show the project dropdown
      cy.visit('/c/local/explorer/namespace/create?flatView=true');
      cy.wait('@getProjects', { timeout: 20000 });
    });

    it('shows project where user has create namespace permission in the dropdown', () => {
      cy.get('[data-testid="name-ns-description-project"]').click();
      cy.get('[data-testid="name-ns-description-project"]')
        .should('contain', projectWithAccess);
    });

    it('does not show project where user is read-only in the dropdown', () => {
      cy.get('[data-testid="name-ns-description-project"]').click();
      cy.get('[data-testid="name-ns-description-project"]')
        .should('not.contain', projectWithoutAccess);
    });
  });

  after(() => {
    cy.login();

    // Clean up projects (this will also clean up associated PRTBs)
    if (projectWithAccessId) {
      cy.deleteRancherResource('v3', 'projects', projectWithAccessId, false);
    }
    if (projectWithoutAccessId) {
      cy.deleteRancherResource('v3', 'projects', projectWithoutAccessId, false);
    }

    // Clean up user
    if (standardUsername) {
      cy.deleteRancherResource('v1', 'management.cattle.io.users', standardUsername, false);
    }
  });
});
