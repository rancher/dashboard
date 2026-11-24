import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import ClusterProjectMembersPo from '@/cypress/e2e/po/pages/explorer/cluster-project-members.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

const username = `${ runPrefix }-cluster-proj-member`;
const standardPassword = 'standard-password';

describe('Cluster Project and Members', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  // Cypress test retries do not roll back server state. A binding created by a previous attempt makes
  // the create form fail with "already exists", so it never navigates back to the members list and the
  // retry then fails on the members url assertion. Drop any leftover binding before creating one.
  const removeUserBindings = (resourceType: 'clusterroletemplatebindings' | 'projectroletemplatebindings') => {
    cy.getRancherResource('v3', `users?username=${ username }`).then((resp: any) => {
      const user = resp.body?.data?.[0];

      if (!user) {
        return;
      }

      cy.getRancherResource('v3', `${ resourceType }?userId=${ user.id }`).then((res: any) => {
        (res.body?.data || []).filter((binding: any) => binding.userId === user.id).forEach((binding: any) => {
          cy.deleteRancherResource('v3', resourceType, binding.id, false);
          // Wait for it to actually be gone, a binding still in `removing` will still conflict
          cy.waitForRancherResource('v3', resourceType, binding.id, (r: any) => r?.status === 404, 20, { failOnStatusCode: false });
        });
      });
    });
  };

  it('Should create a new user', () => {
    const usersAdmin = new UsersPo('_');
    const userCreate = usersAdmin.createEdit();

    // create a standard user
    usersAdmin.goTo();
    usersAdmin.list().create();

    userCreate.username().set(username);
    userCreate.newPass().set(standardPassword);
    userCreate.confirmNewPass().set(standardPassword);
    userCreate.saveCreateWithErrorRetry();
    usersAdmin.waitForPageWithExactUrl();
  });

  it('Members added to both Cluster Membership should not show "Loading..." next to their names', () => {
    removeUserBindings('clusterroletemplatebindings');

    HomePagePo.goTo();

    // add user to Cluster membership
    const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    clusterMembership.navToClusterMenuEntry('local');
    // if we do not wait for the cluster page to load, then we get the old side nav from Users & Authentication
    clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
    clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
    clusterMembership.triggerAddClusterOrProjectMemberAction();

    clusterMembership.selectClusterOrProjectMember(username);
    cy.intercept('POST', '/v3/clusterroletemplatebindings').as('createClusterMembership');
    clusterMembership.saveCreateForm().click();
    // Assert the save itself succeeded. A rejected save keeps the form on screen, which otherwise
    // only surfaces as a confusing "expected .../create to equal .../members" url failure below.
    cy.wait('@createClusterMembership').its('response.statusCode').should('be.oneOf', [200, 201]);

    clusterMembership.waitForPageWithExactUrl();

    // After adding the member the list can lag the create (rancher/dashboard#18846), or the row can
    // render with a still-loading principal (#8804), so the new member isn't queryable by name yet.
    // Reload until the row
    // resolves to the username. The previous reload-only-when-empty check missed the "rows present
    // but the new member's name not resolved yet" case: attempt 1 then timed out here, and because
    // the binding was already created the retry re-added a duplicate and got stuck on the create form.
    //
    // Each reload bootstraps the app again, which bounces to /home when the cluster can't be resolved
    // (ClusterNotFoundError in navigation-guards/clusters.js), so wait for it to be serving first.
    clusterMembership.readyForClusterPage();

    const reloadUntilMemberResolved = (attempt = 0) => {
      clusterMembership.sortableTable().self().then(($table) => {
        if ($table.find(`tbody tr:contains("${ username }")`).length === 0 && attempt < 5) {
          cy.reload();
          clusterMembership.waitForPageWithExactUrl();
          cy.wait(1500); // eslint-disable-line cypress/no-unnecessary-waiting -- let the list re-fetch and principals resolve
          reloadUntilMemberResolved(attempt + 1);
        }
      });
    };

    reloadUntilMemberResolved();

    clusterMembership.listElementWithName(username).should('exist');
    clusterMembership.listElementWithName(username).find('.principal .name').invoke('text').then((t) => {
      // clear new line chars and white spaces
      const sanitizedName = t.trim().replace(/^\n|\n$/g, '');

      // no string "loading..." next to name
      // usecase https://github.com/rancher/dashboard/issues/8804
      expect(sanitizedName).to.equal(username);
    });
  });
  it('Clicking cancel should return to Cluster and Project members ', () => {
    HomePagePo.goTo();
    const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    clusterMembership.navToClusterMenuEntry('local');
    // if we do not wait for the cluster page to load, then we get the old side nav from Users & Authentication
    clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
    clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
    clusterMembership.triggerAddClusterOrProjectMemberAction();
    clusterMembership.cancelCreateForm().click();
    clusterMembership.waitForPageWithExactUrl();
  });
  it('Can create a member with custom permissions', () => {
    removeUserBindings('projectroletemplatebindings');

    // add user to Cluster membership
    const projectMembership = new ClusterProjectMembersPo('local', 'project-membership');

    projectMembership.goTo();
    projectMembership.waitForPageWithSpecificUrl('/c/local/explorer/members#project-membership');
    projectMembership.triggerAddProjectMemberAction('default');
    projectMembership.selectProjectCustomPermission();
    projectMembership.selectClusterOrProjectMember(username);
    projectMembership.checkTheseProjectCustomPermissions([0, 1]);

    cy.intercept('POST', '/v3/projectroletemplatebindings').as('createProjectMembership');
    projectMembership.submitProjectCreateButton();
    // A rejected save leaves the modal open, so surface that here rather than as a later list failure
    cy.wait('@createProjectMembership').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get('.modal-overlay').should('not.exist');

    projectMembership.goTo();
    projectMembership.waitForPageWithSpecificUrl('/c/local/explorer/members#project-membership');

    cy.get('body tbody').then((el) => {
      if (el.find('tr.no-rows').is(':visible')) {
        cy.reload();
      }

      // Assert on the permissions cell with a retrying assertion (not a one-shot invoke('text')):
      // the cell can render its permissions incrementally, so a single read can catch only the first.
      projectMembership.projectTable().rowElementWithName(username).find('td:nth-of-type(3)').first()
        .should('include.text', 'Create Namespaces')
        .and('include.text', 'Manage Config Maps');
    });
  });

  describe('Locked role templates', () => {
    const createdRoleTemplateIds: string[] = [];

    afterEach(() => {
      while (createdRoleTemplateIds.length) {
        const id = createdRoleTemplateIds.pop();

        if (id) {
          cy.deleteRancherResource('v3', 'roletemplates', id, false);
        }
      }
    });

    it('Disables locked cluster and project role templates and displays lock icon', () => {
      const lockedClusterRoleName = `${ runPrefix }-locked-cluster-role`;
      const lockedProjectRoleName = `${ runPrefix }-locked-project-role`;

      cy.createRancherResource('v3', 'roletemplates', JSON.stringify({
        type:    'roleTemplate',
        name:    lockedClusterRoleName,
        context: 'cluster',
        locked:  true,
        builtin: false,
        hidden:  false,
        rules:   [{
          apiGroups: [''], resources: ['nodes'], verbs: ['get']
        }]
      })).then((resp: Cypress.Response<any>) => {
        createdRoleTemplateIds.push(resp.body.id);
      });

      cy.createRancherResource('v3', 'roletemplates', JSON.stringify({
        type:    'roleTemplate',
        name:    lockedProjectRoleName,
        context: 'project',
        locked:  true,
        builtin: false,
        hidden:  false,
        rules:   [{
          apiGroups: [''], resources: ['configmaps'], verbs: ['get']
        }]
      })).then((resp: Cypress.Response<any>) => {
        createdRoleTemplateIds.push(resp.body.id);
      });

      const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

      HomePagePo.goTo();
      clusterMembership.navToClusterMenuEntry('local');
      clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
      clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
      clusterMembership.triggerAddClusterOrProjectMemberAction();

      clusterMembership.permissionOptions().self().contains('label.radio-container', lockedClusterRoleName).within(() => {
        cy.root().should('have.class', 'disabled');
        cy.get('span[role="radio"]').should('have.attr', 'aria-disabled', 'true');
        cy.get('i.icon-lock').should('exist');
        cy.root().click({ force: true }).should('not.have.class', 'radio-button-checked');
      });

      clusterMembership.cancelCreateForm().click();
      clusterMembership.waitForPageWithExactUrl();

      const projectMembership = new ClusterProjectMembersPo('local', 'project-membership');

      projectMembership.goTo();
      projectMembership.waitForPageWithSpecificUrl('/c/local/explorer/members#project-membership');
      projectMembership.triggerAddProjectMemberAction('default');

      projectMembership.permissionOptions().self().contains('label.radio-container', lockedProjectRoleName).within(() => {
        cy.root().should('have.class', 'disabled');
        cy.get('span[role="radio"]').should('have.attr', 'aria-disabled', 'true');
        cy.get('i.icon-lock').should('exist');
        cy.root().click({ force: true }).should('not.have.class', 'radio-button-checked');
      });
    });
  });
});

describe('Cluster Membership Add button', { tags: ['@explorer2', '@adminUser'] }, () => {
  const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');
  const usernamePrefix = 'add-button-';

  const loginAsNewUserWithClusterRole = (clusterRole: 'cluster-member' | 'cluster-owner') => {
    cy.login();
    cy.createUser({
      username:    `${ usernamePrefix }${ clusterRole }-${ Date.now() }`,
      globalRole:  { role: 'user' },
      clusterRole: { clusterId: 'local', role: clusterRole },
      password:    Cypress.env('password'),
    }).then((resp: Cypress.Response<any>) => {
      cy.login(resp.body.username, Cypress.env('password'), false);
    });
    cy.waitForRancherResource('v1', 'management.cattle.io.clusters', 'local', (resp: Cypress.Response<any>) => resp.status === 200, 20, { failOnStatusCode: false })
      .should('eq', true);
  };

  const deleteUsersCreatedByThisRun = () => {
    cy.getRootE2EResourceName().then((root) => {
      cy.getRancherResource('v3', 'users?limit=-1').then((resp: Cypress.Response<any>) => {
        (resp.body?.data || [])
          .filter((user: any) => user.username?.startsWith(`${ root }-${ usernamePrefix }`))
          .forEach((user: any) => cy.deleteRancherResource('v1', 'management.cattle.io.users', user.id, false));
      });
    });
  };

  const navToClusterMembership = () => {
    HomePagePo.goTo();
    clusterMembership.navToClusterMenuEntry('local');
    clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
    clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
    clusterMembership.waitForPageWithExactUrl();
    clusterMembership.clusterMembershipTab().should('be.visible');
    clusterMembership.sortableTable().checkLoadingIndicatorNotVisible();
  };

  afterEach(() => {
    cy.login();
    deleteUsersCreatedByThisRun();
  });

  it('is not shown to a cluster member, who cannot add cluster members', () => {
    loginAsNewUserWithClusterRole('cluster-member');
    navToClusterMembership();

    clusterMembership.clusterMemberAddButton().should('not.exist');
  });

  it('is shown to a cluster owner, who can add cluster members', () => {
    loginAsNewUserWithClusterRole('cluster-owner');
    navToClusterMembership();

    clusterMembership.clusterMemberAddButton().should('be.visible');
  });
});
