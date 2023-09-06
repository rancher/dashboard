import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import RolesPo from '@/cypress/e2e/po/pages/users-and-auth/roles.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';

const roles = new RolesPo('_');
const usersPo = new UsersPo('_');
const userCreate = usersPo.createEdit();

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;
const downloadsFolder = Cypress.config('downloadsFolder');
const globalRoleName = `${ runPrefix }-my-global-role`;

describe('Roles', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('can create a Global Role', () => {
    // create global role
    const fragment = 'GLOBAL';

    roles.goTo(undefined, fragment);
    roles.waitForPage(undefined, fragment);
    roles.listCreate('Create Global Role');

    const createGlobalRole = roles.createGlobal();

    createGlobalRole.waitForPage('roleContext=GLOBAL', 'grant-resources');
    createGlobalRole.name().set(globalRoleName);
    createGlobalRole.description().set('e2e-description');
    createGlobalRole.selectCreatorDefaultRadioBtn(0);
    createGlobalRole.selectVerbs(0, 3);
    createGlobalRole.selectVerbs(0, 4);
    createGlobalRole.selectResourcesByLabelValue(0, 'GlobalRoles');
    createGlobalRole.saveAndWaitForRequests('POST', '/v3/globalroles').then((res) => {
      const globalRoleId = res.response?.body.id;

      // view role details
      roles.waitForPage(undefined, fragment);
      roles.list().details(globalRoleName, 2).find('a').click();

      const globalRoleDetails = roles.detailGlobal(globalRoleId);

      globalRoleDetails.waitForPage();
      globalRoleDetails.mastheadTitle().should('include', `${ globalRoleName }`);
    });
  });

  it('can create a Cluster Role', () => {
    const clusterRoleName = `${ runPrefix }-my-cluster-role`;
    const fragment = 'CLUSTER';

    // create cluster role
    roles.goTo(undefined, fragment);

    roles.waitForPage(undefined, fragment);
    roles.listCreate('Create Cluster Role');

    const createClusterRole = roles.createRole();

    createClusterRole.waitForPage('roleContext=CLUSTER', 'grant-resources');
    createClusterRole.name().set(clusterRoleName);
    createClusterRole.description().set('e2e-description');
    createClusterRole.selectCreatorDefaultRadioBtn(0);
    createClusterRole.selectLockedRadioBtn(0);
    createClusterRole.selectVerbs(0, 3);
    createClusterRole.selectVerbs(0, 4);
    createClusterRole.selectResourcesByLabelValue(0, 'ClusterRoles');
    createClusterRole.saveAndWaitForRequests('POST', '/v3/roletemplates').then((res) => {
      const clusterRoleId = res.response?.body.id;

      // view role details
      roles.waitForPage(undefined, fragment);
      roles.list().details(clusterRoleName, 2).find('a').click();

      const clusterRoleDetails = roles.detailRole(clusterRoleId);

      clusterRoleDetails.waitForPage();
      cy.contains(`Cluster - ${ clusterRoleName }`);
    });
  });

  it('can create a Project/Namespaces', () => {
    const fragment = 'NAMESPACE';
    const projectRoleName = `${ runPrefix }-my-project-role`;

    // create project role
    roles.goTo(undefined, fragment);
    roles.waitForPage(undefined, fragment);
    roles.listCreate('Create Project/Namespaces Role');

    const createProjectRole = roles.createRole();

    createProjectRole.waitForPage('roleContext=NAMESPACE', 'grant-resources');
    createProjectRole.name().set(projectRoleName);
    createProjectRole.description().set('e2e-description');
    createProjectRole.selectCreatorDefaultRadioBtn(0);
    createProjectRole.selectLockedRadioBtn(0);
    createProjectRole.selectVerbs(0, 3);
    createProjectRole.selectVerbs(0, 4);
    createProjectRole.selectResourcesByLabelValue(0, 'Namespaces');
    createProjectRole.saveAndWaitForRequests('POST', '/v3/roletemplates').then((res) => {
      const projectRoleId = res.response?.body.id;

      // view role details
      roles.waitForPage(undefined, fragment);
      roles.list().details(projectRoleName, 2).find('a').click();

      const projectRoleDetails = roles.detailRole(projectRoleId);

      projectRoleDetails.waitForPage();
      cy.contains(`Project/Namespaces - ${ projectRoleName }`);
    });
  });

  it('can Download YAML', () => {
    // Download YAML and verify file exists

    roles.waitForRequests();
    roles.list().elementWithName(globalRoleName).click();
    cy.intercept('GET', '/v1/management.cattle.io.globalroles/*').as('downloadYaml');
    roles.list().downloadYaml().click();
    cy.wait('@downloadYaml', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
    const downloadedFilename = path.join(downloadsFolder, `${ globalRoleName }.yaml`);

    cy.readFile(downloadedFilename).should('exist');
  });

  it('can delete a role', () => {
    // Delete role and verify role is removed from list
    roles.waitForRequests();
    roles.list().elementWithName(globalRoleName).click();
    roles.list().delete().click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', '/v3/globalRoles/*').as('deleteRole');
    promptRemove.remove();
    cy.wait('@deleteRole').its('response.statusCode').should('be.lessThan', 300); // Can sometimes be 204
    roles.list().elementWithName(globalRoleName).should('not.exist');
  });

  it('Standard user with List, Get & Resources: Global Roles should be able to list users in Users and Auth', () => {
    const customRoleName = `${ runPrefix }-my-custom-role`;
    const standardUsername = `${ runPrefix }-standard-user-e2e`;
    const standardPassword = 'standard-password';

    // create global role
    roles.goTo();
    roles.listCreate('Create Global Role');

    const createGlobal = roles.createGlobal();

    createGlobal.name().set(customRoleName);
    createGlobal.selectVerbs(0, 3);
    createGlobal.selectVerbs(0, 4);
    createGlobal.selectResourcesByLabelValue(0, 'GlobalRoles');
    createGlobal.saveAndWaitForRequests('POST', '/v3/globalroles');

    // create standard user
    usersPo.goTo();
    usersPo.list().create();

    userCreate.username().set(standardUsername);
    userCreate.newPass().set(standardPassword);
    userCreate.confirmNewPass().set(standardPassword);
    userCreate.selectCheckbox(customRoleName).set();
    userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings', true);

    // let's just check that the user is on the list view before attempting to login
    usersPo.goTo();
    usersPo.waitForPage();
    usersPo.list().elementWithName(standardUsername).should('exist');

    // logout admin
    cy.logout();

    // login as standard user
    cy.login(standardUsername, standardPassword);

    // navigate to the roles page and make sure user can see it
    roles.goTo();
    roles.list().masthead().title().should('contain', 'Role Templates');
    roles.list().elements().should('have.length.of.at.least', 1);

    // navigate to the users page and make sure user can see it
    usersPo.waitForRequests();
    usersPo.list().masthead().title().should('contain', 'Users');
    usersPo.list().elements().should('have.length', 1);
  });
});
