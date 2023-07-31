import UsersPo from '~/cypress/e2e/po/pages/users-and-auth/users.po';
import RolesPo from '@/cypress/e2e/po/pages/users-and-auth/roles.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import MgmtUserEditPo from '@/cypress/e2e/po/edit/management.cattle.io.user.po';

const globalRoles = new RolesPo('_', '#GLOBAL', undefined);
const usersPo = new UsersPo('_');
const userCreate = usersPo.createEdit();

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;
const downloadsFolder = Cypress.config('downloadsFolder');
const standardUsername = `${ runPrefix }-standard-user`;
const standardPassword = 'standardUser-password';
const userBaseUsername = `${ runPrefix }-userBase-user`;
const globalRoleName = `${ runPrefix }-my-global-role`;

let userId: string;

describe('Users and Authentication', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Users', () => {
    it('can create Admin', () => {
      const adminUsername = `${ runPrefix }-admin-user`;
      const adminPassword = 'admin-password';

      usersPo.goTo();
      usersPo.list().create();

      userCreate.waitForPage();
      userCreate.username().set(adminUsername);
      userCreate.newPass().set(adminPassword);
      userCreate.confirmNewPass().set(adminPassword);
      userCreate.selectCheckbox('Administrator').set();
      userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings');
    });

    it('can create Restricted Admin', () => {
      const restrictedAdminUsername = `${ runPrefix }-restrictedAdmin-user`;
      const restrictedAdminPassword = 'restrictedAdmin-password';

      usersPo.goTo();
      usersPo.list().create();

      userCreate.waitForPage();
      userCreate.username().set(restrictedAdminUsername);
      userCreate.newPass().set(restrictedAdminPassword);
      userCreate.confirmNewPass().set(restrictedAdminPassword);
      userCreate.selectCheckbox('Restricted Administrator').set();
      userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings');
    });

    it('can create User-Base', () => {
      const userBasePassword = 'userBase-password';

      usersPo.goTo();
      usersPo.list().create();

      userCreate.waitForPage();
      userCreate.username().set(userBaseUsername);
      userCreate.newPass().set(userBasePassword);
      userCreate.confirmNewPass().set(userBasePassword);
      userCreate.selectCheckbox('User-Base').set();
      userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings');

      // usersPo.goTo();
      usersPo.waitForPage();
      usersPo.list().elementWithName(userBaseUsername).should('be.visible');
    });

    it('can create Standard User and view their details', () => {
      usersPo.goTo();
      usersPo.list().create();

      userCreate.username().set(standardUsername);
      userCreate.newPass().set(standardPassword);
      userCreate.confirmNewPass().set(standardPassword);

      // verify standard user checkbox selected by default
      userCreate.selectCheckbox('Standard User').isChecked();

      userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings').then((res) => {
        userId = res.response?.body.userId;

        usersPo.waitForPage();
        usersPo.list().elementWithName(standardUsername).should('be.visible');

        // view user's details
        usersPo.list().details(standardUsername, 2).find('a').click();

        const userDetails = usersPo.detail(userId);

        userDetails.waitForPage();
        userDetails.mastheadTitle().should('contain', standardUsername);
      });
    });

    it('can Refresh Group Memberships', () => {
      // Refresh Group Membership and verify request is made
      usersPo.goTo();
      cy.intercept('POST', '/v3/users?action=refreshauthprovideraccess').as('refreshGroup');
      usersPo.list().refreshGroupMembership().click();
      cy.wait('@refreshGroup').its('response.statusCode').should('eq', 200);
    });

    describe('Action Menu', () => {
      it('can Deactivate and Activate user', () => {
        // Deactivate user and check state is Inactive
        usersPo.goTo();
        usersPo.list().clickRowActionMenuItem(standardUsername, 'Deactivate');
        usersPo.list().details(standardUsername, 1).should('include.text', 'Inactive');

        // Activate user and check state is Active
        usersPo.list().clickRowActionMenuItem(standardUsername, 'Activate');
        usersPo.list().details(standardUsername, 1).should('include.text', 'Active');
      });

      it('can Refresh Group Memberships', () => {
        // Refresh Group Membership and verify request is made
        cy.intercept('POST', `/v3/users/${ userId }?action=refreshauthprovideraccess`).as('refreshGroup');
        usersPo.waitForRequests();
        usersPo.list().clickRowActionMenuItem(standardUsername, 'Refresh Group Memberships');
        cy.wait('@refreshGroup').its('response.statusCode').should('eq', 200);
      });

      it('can Edit Config', () => {
        // Edit user and make sure edit is saved
        const userEdit = usersPo.createEdit(userId);

        usersPo.waitForRequests();
        usersPo.list().clickRowActionMenuItem(standardUsername, 'Edit Config');
        userEdit.waitForPage();
        userEdit.mastheadTitle().should('contain', standardUsername);
        const mgmtUserEditPo = new MgmtUserEditPo();

        mgmtUserEditPo.description().set('e2e_test');
        mgmtUserEditPo.saveAndWaitForRequests('PUT', `/v3/users/${ userId }`).then((res) => {
          expect(res.response?.statusCode).to.equal(200);
          expect(res.response?.body.description).to.equal('e2e_test');
        });
      });

      it('can View YAML', () => {
        // View YAML and verify user lands on correct page

        // We don't have a good pattern for the view/edit yaml page yet
        const viewYaml = usersPo.createEdit(userId);

        usersPo.goTo();
        usersPo.list().clickRowActionMenuItem(standardUsername, 'View YAML');
        cy.url().should('include', `?mode=view&as=yaml`);
        viewYaml.mastheadTitle().should('contain', standardUsername);
      });

      it('can Download YAML', () => {
        // Download YAML and verify file exists
        const downloadedFilename = path.join(downloadsFolder, `${ standardUsername }.yaml`);

        usersPo.goTo();
        usersPo.list().clickRowActionMenuItem(standardUsername, 'Download YAML');
        cy.readFile(downloadedFilename).should('exist').then((buffer) => {
          const obj: any = jsyaml.load(buffer);

          // Basic checks on the downloaded YAML
          expect(obj.username).to.equal(standardUsername);
          expect(obj.apiVersion).to.equal('management.cattle.io/v3');
          expect(obj.kind).to.equal('User');
        });
      });

      it('can Delete user', () => {
        // Delete user and verify user is removed from list
        usersPo.goTo();
        usersPo.list().clickRowActionMenuItem(standardUsername, 'Delete');

        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', '/v3/users/*').as('deleteUser');
        promptRemove.confirm(standardUsername);
        promptRemove.remove();
        cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
        usersPo.list().elementWithName(standardUsername).should('not.exist');
      });
    });

    describe('Bulk Actions', () => {
      it('can Deactivate and Activate users', () => {
        // Deactivate user and check state is Inactive
        cy.intercept('PUT', '/v3/users/*').as('updateUsers');
        usersPo.waitForRequests();
        usersPo.list().selectAll().set();
        usersPo.list().deactivate().click();
        cy.wait('@updateUsers');
        cy.contains('Inactive');
        usersPo.list().details('admin', 1).should('include.text', 'Active');
        usersPo.list().details(userBaseUsername, 1).should('include.text', 'Inactive');

        // Activate user and check state is Active
        usersPo.list().activate().click();
        cy.wait('@updateUsers');
        usersPo.list().details(userBaseUsername, 1).should('include.text', 'Active');
      });

      it('can Download YAML', () => {
        // Download YAML and verify file exists
        usersPo.waitForRequests();
        usersPo.list().selectAll().set();
        usersPo.list().openBulkActionDropdown();

        cy.intercept('GET', '/v1/management.cattle.io.users/*').as('downloadYaml');
        usersPo.list().bulkActionButton('Download YAML').click();
        cy.wait('@downloadYaml', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
        const downloadedFilename = path.join(downloadsFolder, 'resources.zip');

        cy.readFile(downloadedFilename).should('exist');
      });

      it('can Delete user', () => {
        // Delete user and verify user is removed from list
        usersPo.waitForRequests();
        usersPo.list().elementWithName(userBaseUsername).click();
        usersPo.list().openBulkActionDropdown();
        usersPo.list().bulkActionButton('Delete').click();
        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', '/v3/users/*').as('deleteUser');
        promptRemove.confirm(userBaseUsername);
        promptRemove.remove();
        cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
        usersPo.list().elementWithName(userBaseUsername).should('not.exist');
      });
    });
  });

  describe('Role Templates', () => {
    it('can create a Global Role', () => {
      // create global role
      globalRoles.goTo();
      globalRoles.waitForPage();
      globalRoles.listCreate('Create Global Role');

      const createGlobalRole = new RolesPo('_', '/management.cattle.io.globalrole/create', undefined);

      createGlobalRole.waitForPage('roleContext=GLOBAL', 'grant-resources');
      globalRoles.name().set(globalRoleName);
      globalRoles.description().set('e2e-description');
      globalRoles.selectCreatorDefaultRadioBtn(0);
      globalRoles.selectVerbs(0, 3);
      globalRoles.selectVerbs(0, 4);
      globalRoles.selectResourcesByLabelValue(0, 'GlobalRoles');
      globalRoles.saveAndWaitForRequests('POST', '/v3/globalroles').then((res) => {
        const globalRoleId = res.response?.body.id;

        // view role details
        globalRoles.waitForPage();
        globalRoles.listDetails(globalRoleName, 2).find('a').click();

        const globalRoleDetails = new RolesPo('_', 'management.cattle.io.globalrole', globalRoleId);

        globalRoleDetails.waitForPage();
        cy.contains(`GlobalRole: ${ globalRoleName }`);
      });
    });

    it('can create a Cluster Role', () => {
      const clusterRoles = new RolesPo('_', '#CLUSTER', undefined);
      const clusterRoleName = `${ runPrefix }-my-cluster-role`;

      // create cluster role
      clusterRoles.goTo();
      clusterRoles.waitForPage();
      clusterRoles.listCreate('Create Cluster Role');

      const createClusterRole = new RolesPo('_', '/management.cattle.io.roletemplate/create', undefined);

      createClusterRole.waitForPage('roleContext=CLUSTER', 'grant-resources');
      clusterRoles.name().set(clusterRoleName);
      clusterRoles.description().set('e2e-description');
      clusterRoles.selectCreatorDefaultRadioBtn(0);
      clusterRoles.selectLockedRadioBtn(0);
      clusterRoles.selectVerbs(0, 3);
      clusterRoles.selectVerbs(0, 4);
      clusterRoles.selectResourcesByLabelValue(0, 'ClusterRoles');
      clusterRoles.saveAndWaitForRequests('POST', '/v3/roletemplates').then((res) => {
        const clusterRoleId = res.response?.body.id;

        // view role details
        clusterRoles.waitForPage();
        clusterRoles.listDetails(clusterRoleName, 2).find('a').click();

        const clusterRoleDetails = new RolesPo('_', 'management.cattle.io.roletemplate', clusterRoleId);

        clusterRoleDetails.waitForPage();
        cy.contains(`RoleTemplate: Cluster - ${ clusterRoleName }`);
      });
    });

    it('can create a Project/Namespaces', () => {
      const projectRoles = new RolesPo('_', '#NAMESPACE', undefined);
      const projectRoleName = `${ runPrefix }-my-project-role`;

      // create project role
      projectRoles.goTo();
      projectRoles.waitForPage();
      projectRoles.listCreate('Create Project/Namespaces Role');

      const createProjectRole = new RolesPo('_', '/management.cattle.io.roletemplate/create', undefined);

      createProjectRole.waitForPage('roleContext=NAMESPACE', 'grant-resources');
      projectRoles.name().set(projectRoleName);
      projectRoles.description().set('e2e-description');
      projectRoles.selectCreatorDefaultRadioBtn(0);
      projectRoles.selectLockedRadioBtn(0);
      projectRoles.selectVerbs(0, 3);
      projectRoles.selectVerbs(0, 4);
      projectRoles.selectResourcesByLabelValue(0, 'Namespaces');
      projectRoles.saveAndWaitForRequests('POST', '/v3/roletemplates').then((res) => {
        const projectRoleId = res.response?.body.id;

        // view role details
        projectRoles.waitForPage();
        projectRoles.listDetails(projectRoleName, 2).find('a').click();

        const clusterRoleDetails = new RolesPo('_', 'management.cattle.io.roletemplate', projectRoleId);

        clusterRoleDetails.waitForPage();
        cy.contains(`RoleTemplate: Project/Namespaces - ${ projectRoleName }`);
      });
    });

    it('can Download YAML', () => {
      // Download YAML and verify file exists

      globalRoles.waitForRequests();
      globalRoles.listElementWithName(globalRoleName).click();
      cy.intercept('GET', '/v1/management.cattle.io.globalroles/*').as('downloadYaml');
      globalRoles.listDownloadYaml().click();
      cy.wait('@downloadYaml', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
      const downloadedFilename = path.join(downloadsFolder, `${ globalRoleName }.yaml`);

      cy.readFile(downloadedFilename).should('exist');
    });

    it('can delete a role', () => {
      // Delete role and verify role is removed from list
      globalRoles.waitForRequests();
      globalRoles.listElementWithName(globalRoleName).click();
      globalRoles.listDelete().click();
      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', '/v3/globalRoles/*').as('deleteRole');
      promptRemove.remove();
      cy.wait('@deleteRole').its('response.statusCode').should('eq', 200);
      globalRoles.listElementWithName(globalRoleName).should('not.exist');
    });

    it('Standard user with List, Get & Resources: Global Roles should be able to list users in Users and Auth', () => {
      const customRoleName = `${ runPrefix }-my-custom-role`;
      const standardUsername = `${ runPrefix }-standard-user-e2e`;
      const standardPassword = 'standard-password';

      // create global role
      globalRoles.goTo();
      globalRoles.listCreate('Create Global Role');

      globalRoles.name().set(customRoleName);
      globalRoles.selectVerbs(0, 3);
      globalRoles.selectVerbs(0, 4);
      globalRoles.selectResourcesByLabelValue(0, 'GlobalRoles');
      globalRoles.saveAndWaitForRequests('POST', '/v3/globalroles');

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
      globalRoles.goTo();
      globalRoles.listTitle().should('contain', 'Role Templates');
      globalRoles.listElements().should('have.length.of.at.least', 1);

      // navigate to the users page and make sure user can see it
      usersPo.waitForRequests();
      usersPo.list().title().should('contain', 'Users');
      usersPo.list().elements().should('have.length', 1);
    });
  });
});
