import RolesPo from '@/cypress/e2e/po/pages/users-and-auth/roles.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

const roles = new RolesPo('_');
const usersPo = new UsersPo('_');
const userCreate = usersPo.createEdit();
const sideNav = new ProductNavPo();

const downloadsFolder = Cypress.config('downloadsFolder');

let runTimestamp;
let runPrefix;
let globalRoleName;

describe('Roles', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    cy.viewport(1280, 720);
  });

  it('can create a Global Role', () => {
    // We want to define these here because if this test fails after it created the global role all subsequent
    // retries will reference the wrong global-role because a second roll will with the same name but different id will be created
    runTimestamp = +new Date();
    runPrefix = `e2e-test-${ runTimestamp }`;
    globalRoleName = `${ runPrefix }-my-global-role`;

    // create global role
    const fragment = 'GLOBAL';

    roles.goTo(undefined, fragment);
    roles.waitForPage(undefined, fragment);

    // check if burger menu nav is highlighted correctly for users & auth
    // https://github.com/rancher/dashboard/issues/10010
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Users & Authentication');

    // catching regression https://github.com/rancher/dashboard/issues/10576
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local', false);

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

      // testing https://github.com/rancher/dashboard/issues/9800
      // confirming that the globalRole created is not flagged as built-in
      roles.list().checkBuiltIn(globalRoleName, false);
      // eo test

      roles.list().details(globalRoleName, 2).find('a').click();

      const globalRoleDetails = roles.detailGlobal(globalRoleId);

      globalRoleDetails.waitForPage();
      globalRoleDetails.mastheadTitle().should('include', `${ globalRoleName }`);

      sideNav.navToSideMenuEntryByLabel('Role Templates');
      roles.waitForPage(undefined, fragment);

      // testing https://github.com/rancher/dashboard/issues/5291
      roles.list().checkDefault(globalRoleName, true);
      UsersPo.navTo();
      usersPo.list().create();
      userCreate.waitForPage();
      userCreate.globalRoleBindings().roleCheckbox(globalRoleId).checkVisible();
      userCreate.globalRoleBindings().roleCheckbox(globalRoleId).isChecked();
      sideNav.navToSideMenuEntryByLabel('Role Templates');

      // testing https://github.com/rancher/dashboard/issues/9800
      roles.goToEditYamlPage(globalRoleName);

      createGlobalRole.yamlEditor().value().then((val) => {
        // convert yaml into json to update values
        const json: any = jsyaml.load(val);

        json.builtin = false;

        createGlobalRole.yamlEditor().set(jsyaml.dump(json));
        createGlobalRole.saveEditYamlForm().click();

        roles.waitForPage();
        // confirming, once again, that the globalRole created is not flagged as built-in
        roles.list().details(globalRoleName, 4).should('not.contain', 'i.icon-checkmark');
      });
      // eo test
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
      roles.list().checkDefault(clusterRoleName, true);
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
      roles.list().checkDefault(projectRoleName, true);
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

  it('shows warning message when deleting the Administrator role', () => {
    const fragment = 'GLOBAL';
    const globalAdminRoleName = 'Administrator';

    roles.goTo(undefined, fragment);
    roles.waitForPage(undefined, fragment);

    // Show delete confirmation dialog
    roles.waitForRequests();
    roles.list().elementWithName(globalAdminRoleName).click();
    roles.list().delete().click();
    const promptRemove = new PromptRemove();

    promptRemove.warning().should('be.visible');
    promptRemove.warning().shouldHaveCssVar('color', '--warning'); // Check warning message color
    promptRemove.warning().first().should('contain.text', 'Caution:'); // Check warning message content
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
